import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';
import { createInterface } from 'node:readline';
import { setTimeout as delay } from 'node:timers/promises';

const container = 'supabase_db_premiumwash-2-local';
const context = ['--context', 'desktop-linux'];
const network = 'premiumwash-2-local-loopback';

class PsqlSession {
  pending = null;
  sequence = 0;

  constructor() {
    this.child = spawn('docker', [
      ...context, 'exec', '-i', '-e', 'PGCLIENTENCODING=UTF8', container,
      'psql', '-X', '-qAt', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=off',
    ], { windowsHide: true, stdio: ['pipe', 'pipe', 'ignore'] });
    this.closed = new Promise((resolve) => this.child.once('close', resolve));
    this.child.once('error', () => this.cancel('Unable to start local psql.'));
    this.child.once('close', () => this.cancel('The local psql connection closed.'));
    this.child.stdin.on('error', () => this.cancel('Unable to write to local psql.'));
    createInterface({ input: this.child.stdout }).on('line', (line) => {
      const request = this.pending;
      if (!request) return;
      if (line !== request.end) {
        request.lines.push(line);
        return;
      }
      clearTimeout(request.timer);
      this.pending = null;
      const code = request.lines.pop();
      request.resolve({ code, rows: request.lines });
    });
  }

  cancel(message) {
    const request = this.pending;
    if (!request) return;
    clearTimeout(request.timer);
    this.pending = null;
    request.reject(new Error(message));
  }

  run(sql) {
    assert.equal(this.pending, null, 'Each psql session runs one command at a time.');
    const end = 'premiumwash_test_end_' + ++this.sequence;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => this.cancel('Timed out waiting for local psql.'), 10_000);
      this.pending = { resolve, reject, timer, end, lines: [] };
      this.child.stdin.write(sql + '\n\\echo :SQLSTATE\n\\echo ' + end + '\n');
    });
  }

  async close() {
    if (!this.child.stdin.destroyed) this.child.stdin.end('\\q\n');
    const timer = setTimeout(() => this.child.kill(), 3_000);
    try { await this.closed; } finally { clearTimeout(timer); }
  }
}

function quote(value) {
  return "'" + value.replaceAll("'", "''") + "'";
}

function rpc(phone, marker, key = randomBytes(32).toString('hex')) {
  const payload = quote(JSON.stringify({ type: 'consultation', phone, question: marker }));
  return 'SELECT public.create_booking_request(' + payload + '::jsonb, ' + quote(key) + ');';
}

async function query(session, sql) {
  const result = await session.run(sql);
  assert.equal(result.code, '00000', 'A local PostgreSQL command failed.');
  return result.rows;
}

function bookingId(result) {
  assert.equal(result.code, '00000', 'A protected submission should succeed.');
  assert.equal(result.rows.length, 1, 'Expected one booking UUID.');
  assert.match(result.rows[0], /^[0-9a-f-]{36}$/);
  return result.rows[0];
}

async function waitForLock(observer, blocked, blocker) {
  const deadline = Date.now() + 2_100;
  while (Date.now() < deadline) {
    const [locked] = await query(observer, 'SELECT ' + blocker + ' = ANY(pg_blocking_pids(' + blocked + '));');
    if (locked === 't') return;
    await delay(25);
  }
  assert.fail('The second PostgreSQL connection never waited on the first transaction.');
}

async function overlap(observer, first, second, firstPid, secondPid, firstSql, secondSql, readFirst = bookingId) {
  await Promise.all([query(first, 'BEGIN;'), query(second, 'BEGIN;')]);
  const firstResult = await first.run(firstSql);
  const id = readFirst(firstResult);
  const waiting = second.run(secondSql);
  // Observe the second connection while the first transaction still owns the admission lock.
  await waitForLock(observer, secondPid, firstPid);
  await query(first, 'COMMIT;');
  const secondResult = await waiting;
  await query(second, 'COMMIT;');
  return { id, secondResult };
}

async function cleanup(observer, marker) {
  const criteria = 'booking.comment = ' + quote(marker) + " AND booking.type = 'consultation'";
  await query(observer,
    'BEGIN;\n'
    + 'DELETE FROM premiumwash_private.booking_protection_events AS event USING public.bookings AS booking '
    + 'WHERE event.booking_id = booking.id AND ' + criteria + ';\n'
    + 'DELETE FROM public.bookings AS booking WHERE ' + criteria + ';\n'
    + 'COMMIT;');
}

async function verifyFixtureCount(observer, marker, expected) {
  const [counts] = await query(observer,
    'SELECT count(*), count(event.booking_id) FROM public.bookings AS booking '
    + 'LEFT JOIN premiumwash_private.booking_protection_events AS event ON event.booking_id = booking.id '
    + 'WHERE booking.comment = ' + quote(marker) + ';');
  assert.equal(counts, expected + '|' + expected, 'Unexpected number of committed requests or receipts.');
}

async function main() {
  const names = JSON.parse(execFileSync('docker', [
    ...context, 'inspect', '--format', '{{json .NetworkSettings.Networks}}', container,
  ], { encoding: 'utf8', windowsHide: true }));
  assert.deepEqual(Object.keys(names), [network], 'Expected the dedicated local Docker network.');

  const markers = ['same-key', 'phone-limit', 'endpoint-limit'].map(
    (scenario) => 'stage74-' + scenario + '-' + randomUUID(),
  );
  const observer = new PsqlSession();
  const first = new PsqlSession();
  const second = new PsqlSession();

  try {
    const [policy] = await query(observer,
      'SELECT phone_short_limit, phone_short_seconds, phone_long_limit, phone_long_seconds, '
      + 'endpoint_limit, endpoint_seconds, idempotency_seconds FROM premiumwash_private.booking_protection_settings;');
    assert.equal(policy, '3|900|10|86400|30|60|86400', 'The integration test expects the default policy.');
    const [recent] = await query(observer,
      "SELECT count(*) FROM premiumwash_private.booking_protection_events WHERE accepted_at > clock_timestamp() - interval '1 minute';");
    assert.equal(recent, '0', 'Run the local integration test with an available endpoint window.');

    const backends = await Promise.all([first, second].map((session) =>
      query(session, 'SET ROLE service_role; SELECT pg_backend_pid(), current_user;')));
    const [firstPid, secondPid] = backends.map(([row]) => {
      assert.match(row, /^\d+\|service_role$/);
      return row.split('|')[0];
    });
    assert.notEqual(firstPid, secondPid, 'The integration test requires two independent PostgreSQL connections.');

    const sameRequest = rpc('+380500000061', markers[0]);
    const same = await overlap(observer, first, second, firstPid, secondPid, sameRequest, sameRequest);
    assert.equal(bookingId(same.secondResult), same.id, 'Concurrent retries must return the same UUID.');
    await verifyFixtureCount(observer, markers[0], 1);
    console.log('Same key: two overlapping transactions, one committed booking and one UUID.');
    await cleanup(observer, markers[0]);

    for (let count = 0; count < 2; count++) {
      bookingId(await first.run(rpc('+380500000062', markers[1])));
    }
    const phone = await overlap(
      observer, first, second, firstPid, secondPid,
      rpc('+380500000062', markers[1]), rpc('+380500000062', markers[1]),
    );
    assert.equal(phone.secondResult.code, 'PW016', 'The fourth concurrent phone submission must be rate-limited.');
    await verifyFixtureCount(observer, markers[1], 3);
    console.log('Phone quota: two overlapping transactions at the boundary, one success and one PW016.');
    await cleanup(observer, markers[1]);

    const [filled] = await query(first,
      "SELECT count(public.create_booking_request(jsonb_build_object('type','consultation','phone',"
      + "'+380520000' || lpad(n::text,3,'0'),'question'," + quote(markers[2]) + "),"
      + "encode(extensions.gen_random_bytes(32),'hex'))) FROM generate_series(1,29) AS fixtures(n);");
    assert.equal(filled, '29');
    const endpoint = await overlap(
      observer, first, second, firstPid, secondPid,
      rpc('+380500000063', markers[2]), rpc('+380500000064', markers[2]),
    );
    assert.equal(endpoint.secondResult.code, 'PW016', 'The 31st endpoint submission must be rate-limited.');
    await verifyFixtureCount(observer, markers[2], 30);
    console.log('Endpoint quota: two overlapping transactions for distinct phones, one success and one PW016.');

    const [httpUsed] = await query(observer,
      'SELECT count(*) FROM premiumwash_private.booking_http_budget AS budget '
      + "CROSS JOIN LATERAL unnest(budget.admitted_at) AS arrival(value) WHERE value > clock_timestamp() - interval '60 seconds';");
    assert.equal(httpUsed, '0', 'Run the HTTP concurrency test with an empty HTTP window.');
    const [httpFilled] = await query(first,
      'SELECT count(*) FROM generate_series(1,119) WHERE public.admit_booking_http_attempt() = 0;');
    assert.equal(httpFilled, '119');

    const admissionSql = 'SELECT public.admit_booking_http_attempt();';
    const http = await overlap(
      observer, first, second, firstPid, secondPid, admissionSql, admissionSql,
      (result) => {
        assert.equal(result.code, '00000');
        assert.deepEqual(result.rows, ['0'], 'The 120th HTTP attempt is admitted.');
        return result.rows[0];
      },
    );
    assert.equal(http.secondResult.code, '00000');
    const [retryAfter] = http.secondResult.rows;
    assert.match(retryAfter, /^\d+$/);
    assert.ok(Number(retryAfter) >= 1 && Number(retryAfter) <= 60, 'The 121st HTTP attempt must wait.');
    const [stored] = await query(observer, 'SELECT cardinality(admitted_at) FROM premiumwash_private.booking_http_budget WHERE singleton;');
    assert.equal(stored, '120');
    console.log('HTTP budget: two overlapping connections, one admission and one retry delay. Attempts expire naturally.');
  } finally {
    await Promise.all([first.close(), second.close()]);
    try {
      for (const marker of markers) {
        await cleanup(observer, marker);
        await verifyFixtureCount(observer, marker, 0);
      }
    } finally {
      await observer.close();
    }
  }
  console.log('Removed only the generated integration fixtures.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'The local integration test failed.');
  process.exitCode = 1;
});
