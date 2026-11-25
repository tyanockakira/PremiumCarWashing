import assert from 'node:assert/strict';
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';
import { createInterface } from 'node:readline';

const context = ['--context', 'desktop-linux'];
const project = 'premiumwash-2-local';
const network = 'premiumwash-2-local-loopback';
const database = 'supabase_db_' + project;
const kong = 'supabase_kong_' + project;
const edge = 'supabase_edge_runtime_' + project;
const studio = 'supabase_studio_' + project;
const gatewayUrl = 'http://127.0.0.1:54321/functions/v1/submit-booking-request';
const directUrl = 'http://' + edge + ':8081/submit-booking-request';
const localOrigin = 'http://127.0.0.1:5173';
const foreignOrigin = 'https://outside.invalid';

function docker(args, input) {
  return execFileSync('docker', [...context, ...args], {
    input, encoding: 'utf8', windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'], timeout: 15_000,
  }).trim();
}

function psql(script, variables = []) {
  return docker([
    'exec', '-i', database, 'psql', '-X', '-qAt', '-U', 'postgres', '-d', 'postgres',
    '-v', 'ON_ERROR_STOP=1', ...variables, '-f', '-',
  ], script);
}

function httpUsed() {
  return Number(psql(
    'SELECT count(*) FROM premiumwash_private.booking_http_budget AS budget '
    + "CROSS JOIN LATERAL unnest(budget.admitted_at) AS arrival(value) WHERE value > clock_timestamp() - interval '60 seconds';",
  ));
}

async function probe(base, options) {
  let body = options.body;
  if (options.chunks) {
    body = new ReadableStream({
      start(controller) {
        for (const chunk of options.chunks) controller.enqueue(new TextEncoder().encode(chunk));
        controller.close();
      },
    });
  }
  const response = await fetch(base, {
    method: options.method,
    headers: options.headers,
    body,
    ...(options.chunks ? { duplex: 'half' } : {}),
    signal: AbortSignal.timeout(9000),
    redirect: 'error',
  });
  const text = await response.text();
  let result;
  try { result = JSON.parse(text); } catch { result = null; }
  return {
    status: response.status, result,
    allowOrigin: response.headers.get('access-control-allow-origin'),
    allowMethods: response.headers.get('access-control-allow-methods'),
    retryAfter: response.headers.get('retry-after'),
    cacheControl: response.headers.get('cache-control'),
  };
}

// Studio supplies Node inside the existing bridge. The Edge port stays unpublished.
function direct(options) {
  const runner = 'const run = ' + probe.toString() + ';'
    + "const input = JSON.parse(require('node:fs').readFileSync(0, 'utf8'));"
    + 'run(input.url, input.options).then((result) => console.log(JSON.stringify(result)))'
    + '.catch(() => { process.exitCode = 1; });';
  const output = docker(['exec', '-i', studio, 'node', '-e', runner], JSON.stringify({ url: directUrl, options }));
  return JSON.parse(output);
}

function preflight(origin, extraHeaders = 'Content-Type, Idempotency-Key') {
  return {
    method: 'OPTIONS',
    headers: {
      origin, 'access-control-request-method': 'POST', 'access-control-request-headers': extraHeaders,
    },
  };
}

function post(body, key, origin = localOrigin) {
  return {
    method: 'POST',
    headers: {
      'content-type': 'application/json', 'idempotency-key': key,
      ...(origin === null ? {} : { origin }),
    },
    body: JSON.stringify(body),
  };
}

function expect(result, status, code) {
  assert.equal(result.status, status, 'Unexpected HTTP status.');
  assert.ok(result.result?.code === code && result.result?.success === false, 'Unexpected application error contract.');
  assert.equal(result.cacheControl, 'no-store');
}

async function withLockedBudget(run) {
  const child = spawn('docker', [
    ...context, 'exec', '-i', database, 'psql', '-X', '-qAt', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1',
  ], { windowsHide: true, stdio: ['pipe', 'pipe', 'ignore'] });
  const closed = new Promise((resolve) => child.once('close', resolve));
  const lock = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Could not acquire the local budget fixture lock.')), 5000);
    child.once('error', () => {
      clearTimeout(timer);
      reject(new Error('Could not start the local budget fixture.'));
    });
    child.once('close', () => {
      clearTimeout(timer);
      reject(new Error('The local budget fixture connection closed.'));
    });
    createInterface({ input: child.stdout }).on('line', (line) => {
      if (line !== 'premiumwash_budget_locked') return;
      clearTimeout(timer);
      resolve();
    });
  });
  child.stdin.on('error', () => {});
  child.stdin.write(
    'BEGIN;\nSELECT singleton FROM premiumwash_private.booking_http_budget WHERE singleton FOR UPDATE;\n\\echo premiumwash_budget_locked\n',
  );
  try {
    await lock;
    return run();
  } finally {
    child.stdin.end('ROLLBACK;\n\\q\n');
    const timer = setTimeout(() => child.kill(), 3000);
    try { await closed; } finally { clearTimeout(timer); }
  }
}

async function main() {
  for (const name of [database, edge, studio, kong]) {
    const interfaces = JSON.parse(docker(['inspect', '--format', '{{json .NetworkSettings.Networks}}', name]));
    assert.deepEqual(Object.keys(interfaces), [network], 'Expected the dedicated local Docker bridge.');
  }
  const edgePorts = JSON.parse(docker(['inspect', '--format', '{{json .NetworkSettings.Ports}}', edge]));
  assert.ok(Object.values(edgePorts).every((binding) => binding === null), 'The direct Edge port must stay unpublished.');
  const kongPorts = JSON.parse(docker(['inspect', '--format', '{{json .NetworkSettings.Ports}}', kong]));
  assert.ok(kongPorts['8000/tcp']?.length && kongPorts['8000/tcp'].every(
    ({ HostIp, HostPort }) => ['127.0.0.1', '::1'].includes(HostIp) && HostPort === '54321',
  ), 'Kong must be published only on loopback.');

  assert.equal(httpUsed(), 0, 'Run these probes after the HTTP budget has had a clean 60-second window.');
  const marker = 'stage751-edge-' + randomUUID();
  const since = new Date().toISOString();
  const keys = [];
  const makeKey = () => {
    const value = randomBytes(32).toString('hex');
    keys.push(value);
    return value;
  };
  const consultation = { type: 'consultation', phone: '+380500000081', question: marker };
  const booking = {
    type: 'booking', phone: '+380500000082', name: 'Тестове ім’я', selection: { kind: 'individual' }, comment: marker,
  };
  const consultationKey = makeKey();

  try {
    const unauthorized = await fetch('http://127.0.0.1:54321/rest/v1/rpc/admit_booking_http_attempt', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}',
      redirect: 'error', signal: AbortSignal.timeout(5000),
    });
    assert.ok([401, 403, 404].includes(unauthorized.status), 'The admission RPC must reject anonymous PostgREST access.');
    for (const origin of [localOrigin, foreignOrigin]) {
      const pre = await probe(gatewayUrl, preflight(origin));
      assert.equal(pre.status, 200);
      assert.equal(pre.allowOrigin, '*');
    }
    assert.equal(httpUsed(), 0, 'Stock Kong preflight never reached the function or the budget.');

    for (const origin of [localOrigin, 'http://localhost:5173']) {
      const pre = direct(preflight(origin));
      assert.equal(pre.status, 204);
      assert.equal(pre.allowOrigin, origin);
      assert.equal(pre.allowMethods, 'POST');
    }
    const denied = direct(preflight(foreignOrigin));
    expect(denied, 403, 'ORIGIN_NOT_ALLOWED');
    assert.equal(denied.allowOrigin, null);
    expect(direct(preflight(localOrigin, 'X-Unknown')), 400, 'INVALID_PREFLIGHT');
    assert.equal(httpUsed(), 4, 'Every direct preflight received by the handler counts.');

    const invalid = post(consultation, consultationKey);
    invalid.body = '{"type":';
    expect(direct(invalid), 400, 'INVALID_JSON');
    const oversized = post(consultation, consultationKey);
    delete oversized.body;
    oversized.chunks = [' '.repeat(16384), ' '];
    expect(direct(oversized), 413, 'BODY_TOO_LARGE');
    assert.equal(httpUsed(), 6, 'Invalid JSON and chunked oversize requests consume the budget.');
    assert.equal(psql("SELECT count(*) FROM public.bookings WHERE comment = :'marker';",
      ['-v', 'marker=' + marker]), '0');

    const first = direct(post(consultation, consultationKey));
    assert.equal(first.status, 200);
    assert.match(first.result.booking_id, /^[0-9a-f-]{36}$/i);
    const replay = direct(post({ ...consultation, phone: '050 (000) 00-81' }, consultationKey, null));
    assert.equal(replay.status, 200);
    assert.equal(replay.allowOrigin, null);
    assert.ok(replay.result.booking_id === first.result.booking_id, 'Retry must reuse the UUID.');
    expect(direct(post({ ...consultation, name: 'Змінений тестовий текст' }, consultationKey)), 409, 'PW015');

    assert.equal(direct(post(consultation, makeKey())).status, 200);
    assert.equal(direct(post(consultation, makeKey())).status, 200);
    const limit = direct(post(consultation, makeKey()));
    expect(limit, 429, 'PW016');
    assert.ok(/^[1-9]\d*$/.test(limit.retryAfter ?? '') && Number(limit.retryAfter) <= 900);

    const stockBooking = await probe(gatewayUrl, post(booking, makeKey()));
    assert.equal(stockBooking.status, 200);
    console.log('Stock Kong actual POST: success, allow-origin=' + (stockBooking.allowOrigin ?? '(absent)') + '.');
    const stockRejection = await probe(gatewayUrl, post(booking, makeKey(), foreignOrigin));
    expect(stockRejection, 403, 'ORIGIN_NOT_ALLOWED');
    console.log('Stock Kong denied-origin POST: 403 from the handler, allow-origin=' + (stockRejection.allowOrigin ?? '(absent)') + '.');
    assert.equal(httpUsed(), 14, 'Preflights, invalid requests, retry, conflict, limits and denied POST count at runtime.');

    const unavailable = await withLockedBudget(() => direct(post(booking, makeKey())));
    expect(unavailable, 503, 'PW017');
    assert.equal(httpUsed(), 14, 'An unavailable admission cannot spend a place or write a booking.');

    const [rows, receipts] = psql(
      'SELECT count(*), count(event.booking_id) FROM public.bookings AS booking '
      + 'LEFT JOIN premiumwash_private.booking_protection_events AS event ON event.booking_id = booking.id '
      + "WHERE booking.comment = :'marker';", ['-v', 'marker=' + marker],
    ).split('|');
    assert.ok(rows === '4' && receipts === '4', 'Expected only three consultations and one booking.');

    const logs = spawnSync('docker', [...context, 'logs', '--since', since, '--tail', '250', edge], {
      encoding: 'utf8', windowsHide: true, timeout: 10_000,
    });
    assert.equal(logs.status, 0, 'Could not inspect local Edge logs.');
    const runtimeLogs = (logs.stdout ?? '') + '\n' + (logs.stderr ?? '');
    const applicationLogs = runtimeLogs.split(/\r?\n/).flatMap((line) => {
      const start = line.indexOf('{"requestId":');
      if (start < 0) return [];
      try { return [JSON.parse(line.slice(start, line.lastIndexOf('}') + 1))]; } catch { return []; }
    });
    assert.ok(applicationLogs.length >= 15, 'Expected one structured application log per handler invocation.');
    for (const entry of applicationLogs) {
      assert.deepEqual(Object.keys(entry).sort(), ['code', 'durationMs', 'requestId', 'stage', 'status']);
    }
    assert.ok(![marker, consultation.phone, booking.phone, ...keys].some((value) => runtimeLogs.includes(value)),
      'Sensitive fixture values appeared in Edge logs.');
    console.log('Direct route: strict CORS, malformed/chunked budget accounting, replay, 409, 429 and 503 verified.');
    console.log('Edge application logs contain approved metadata only.');
  } finally {
    psql("BEGIN;\nDELETE FROM premiumwash_private.booking_protection_events AS event USING public.bookings AS booking "
      + "WHERE event.booking_id = booking.id AND booking.comment = :'marker';\n"
      + "DELETE FROM public.bookings WHERE comment = :'marker';\nCOMMIT;", ['-v', 'marker=' + marker]);
    assert.equal(psql("SELECT count(*) FROM public.bookings WHERE comment = :'marker';",
      ['-v', 'marker=' + marker]), '0', 'Synthetic bookings should be removed.');
  }
  console.log('Removed only the synthetic bookings and their protection records. HTTP attempts expire naturally.');
}

main().catch((error) => {
  // Child-process output may include adapter diagnostics; do not print it on test failure.
  console.error(error.code === 'ERR_ASSERTION' ? error.message : 'Local route testing failed: ' + error.name);
  process.exitCode = 1;
});
