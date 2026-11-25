import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createBookingHandler } from '../../functions/submit-booking-request/handler.mjs';
import { createBookingBackend } from '../../functions/submit-booking-request/backend.mjs';

const url = 'http://127.0.0.1:54321/functions/v1/submit-booking-request';
const key = 'a'.repeat(64);
const id = '73000000-0000-4000-8000-000000000001';

test('a public POST admits the HTTP attempt before creating a consultation', async () => {
  const calls = [];
  const handler = createBookingHandler({
    turnstileRequired: false,
    backend: {
      async admit() { calls.push('admit'); return 0; },
      async create(request, requestKey) {
        calls.push(['create', request, requestKey]);
        return { data: id };
      },
    },
  });
  const request = { type: 'consultation', phone: '050 000 00 11' };
  const response = await handler(new Request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'idempotency-key': key },
    body: JSON.stringify(request),
  }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true, booking_id: id });
  assert.deepEqual(calls, ['admit', ['create', request, key]]);
});

const origin = 'http://localhost:5173';
const payload = { type: 'consultation', phone: '050 000 00 11' };
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function post({ body = JSON.stringify(payload), headers = {}, path = url } = {}) {
  const allHeaders = new Headers({
    'content-type': 'application/json', 'idempotency-key': key, ...headers,
  });
  return new Request(path, { method: 'POST', headers: allHeaders, body, duplex: 'half' });
}

function preflight(requestOrigin = origin, requestedHeaders = 'Content-Type, Idempotency-Key') {
  return new Request(url, {
    method: 'OPTIONS',
    headers: {
      origin: requestOrigin,
      'access-control-request-method': 'POST',
      'access-control-request-headers': requestedHeaders,
    },
  });
}

function fixture(overrides = {}) {
  const calls = { admits: 0, writes: [] };
  const logs = [];
  const backend = {
    async admit() {
      calls.admits++;
      return overrides.admit ? overrides.admit() : 0;
    },
    async create(request, requestKey) {
      calls.writes.push({ request, requestKey });
      return overrides.create ? overrides.create() : { data: id };
    },
  };
  const handler = createBookingHandler({
    backend,
    log: (entry) => logs.push(entry),
    bodyTimeoutMs: overrides.bodyTimeoutMs,
    turnstileRequired: overrides.turnstileRequired ?? false,
    verifyTurnstile: overrides.verifyTurnstile,
  });
  return { handler, calls, logs };
}

async function expectError(response, status, code) {
  assert.equal(response.status, status);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const error = await response.json();
  assert.deepEqual(Object.keys(error).sort(), ['code', 'message', 'success']);
  assert.equal(error.code, code);
  assert.equal(error.success, false);
  assert.match(error.message, /[А-Яа-яІіЇїЄє]/);
}

test('Turnstile is fail-closed before the booking RPC', async () => {
  for (const [label, headers, verification, status, code] of [
    ['missing token', {}, undefined, 403, 'TURNSTILE_REQUIRED'],
    ['invalid token', { 'cf-turnstile-response': 'invalid' }, { success: false }, 403, 'TURNSTILE_FAILED'],
    ['Siteverify outage', { 'cf-turnstile-response': 'token' }, { unavailable: true }, 503, 'TURNSTILE_UNAVAILABLE'],
  ]) {
    const { handler, calls } = fixture({
      turnstileRequired: true,
      verifyTurnstile: async () => verification,
    });
    const response = await handler(post({ headers }));
    await expectError(response, status, code);
    assert.equal(calls.writes.length, 0, label);
  }
});

test('a valid Turnstile token reaches the booking RPC without being logged', async () => {
  const { handler, calls, logs } = fixture({
    turnstileRequired: true,
    verifyTurnstile: async (token) => ({ success: token === 'valid-token' }),
  });
  const response = await handler(post({ headers: { 'cf-turnstile-response': 'valid-token' } }));
  assert.equal(response.status, 200);
  assert.equal(calls.writes.length, 1);
  assert.equal(JSON.stringify(logs).includes('valid-token'), false);
});

for (const allowedOrigin of [origin, 'http://127.0.0.1:5173']) {
  test('preflight is admitted and reflects only approved origin ' + allowedOrigin, async () => {
    const { handler, calls } = fixture();
    const response = await handler(preflight(allowedOrigin));
    assert.equal(response.status, 204);
    assert.equal(response.headers.get('access-control-allow-origin'), allowedOrigin);
    assert.equal(response.headers.get('access-control-allow-methods'), 'POST');
    assert.equal(response.headers.get('access-control-allow-headers'), 'Content-Type, Idempotency-Key, Cf-Turnstile-Response');
    assert.equal(response.headers.get('access-control-allow-credentials'), null);
    assert.match(response.headers.get('vary'), /Access-Control-Request-Headers/);
    assert.deepEqual(calls, { admits: 1, writes: [] });
  });
}

test('a denied origin gets neither preflight permission nor a booking write', async () => {
  const { handler, calls } = fixture();
  const deniedOrigin = 'https://outside.invalid';
  for (const request of [preflight(deniedOrigin), post({ headers: { origin: deniedOrigin } })]) {
    const response = await handler(request);
    await expectError(response, 403, 'ORIGIN_NOT_ALLOWED');
    assert.equal(response.headers.get('access-control-allow-origin'), null);
  }
  assert.deepEqual(calls, { admits: 2, writes: [] });
});

test('OPTIONS without a valid preflight is declined after admission', async () => {
  const { handler, calls } = fixture();
  await expectError(await handler(new Request(url, { method: 'OPTIONS' })), 400, 'INVALID_PREFLIGHT');
  await expectError(await handler(preflight(origin, 'X-Unknown')), 400, 'INVALID_PREFLIGHT');
  assert.deepEqual(calls, { admits: 2, writes: [] });
});

test('other methods and subpaths still consume the shared HTTP budget', async () => {
  const { handler, calls } = fixture();
  const response = await handler(new Request(url, { method: 'GET' }));
  assert.equal(response.headers.get('allow'), 'POST, OPTIONS');
  await expectError(response, 405, 'METHOD_NOT_ALLOWED');
  await expectError(await handler(post({ path: url + '/other' })), 404, 'ENDPOINT_NOT_FOUND');
  assert.deepEqual(calls, { admits: 2, writes: [] });
});

for (const [label, headers, status, code] of [
  ['untrusted content type', { 'content-type': 'text/plain' }, 415, 'UNSUPPORTED_MEDIA_TYPE'],
  ['non-UTF-8 charset', { 'content-type': 'application/json; charset=iso-8859-1' }, 415, 'UNSUPPORTED_MEDIA_TYPE'],
  ['ambiguous content type', { 'content-type': 'application/json, application/json' }, 415, 'UNSUPPORTED_MEDIA_TYPE'],
  ['compressed entity', { 'content-encoding': 'gzip' }, 415, 'UNSUPPORTED_MEDIA_TYPE'],
  ['malformed declared length', { 'content-length': '5, 5' }, 400, 'INVALID_CONTENT_LENGTH'],
  ['large declared length', { 'content-length': '16385' }, 413, 'BODY_TOO_LARGE'],
  ['uppercase idempotency key', { 'idempotency-key': key.toUpperCase() }, 400, 'PW014'],
  ['combined idempotency keys', { 'idempotency-key': key + ', ' + key }, 400, 'PW014'],
]) {
  test(label + ' is counted and never reaches the booking RPC', async () => {
    const { handler, calls } = fixture();
    await expectError(await handler(post({ headers })), status, code);
    assert.deepEqual(calls, { admits: 1, writes: [] });
  });
}

test('exactly 16 KiB is accepted and one additional actual byte is rejected', async () => {
  const { handler, calls } = fixture();
  const json = JSON.stringify(payload);
  const boundary = json.padEnd(16384, ' ');
  const accepted = await handler(post({ body: boundary, headers: { 'content-type': 'application/json; charset="utf-8"' } }));
  assert.equal(accepted.status, 200);
  await expectError(await handler(post({ body: boundary + ' ', headers: { 'content-length': '1' } })), 413, 'BODY_TOO_LARGE');
  assert.equal(calls.admits, 2);
  assert.equal(calls.writes.length, 1);
});

test('a stream without Content-Length is cancelled as soon as its byte limit is exceeded', async () => {
  const { handler, calls } = fixture();
  let cancelled = false;
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode('ї'.repeat(8192)));
      controller.enqueue(new Uint8Array([32]));
    },
    cancel() { cancelled = true; },
  });
  await expectError(await handler(post({ body })), 413, 'BODY_TOO_LARGE');
  assert.equal(cancelled, true);
  assert.deepEqual(calls, { admits: 1, writes: [] });
});

test('a stalled body read is cancelled at its deadline', async () => {
  const { handler, calls } = fixture({ bodyTimeoutMs: 12 });
  let cancelled = false;
  const body = new ReadableStream({
    cancel() { cancelled = true; },
  });
  await expectError(await handler(post({ body })), 408, 'BODY_READ_TIMEOUT');
  assert.equal(cancelled, true);
  assert.deepEqual(calls, { admits: 1, writes: [] });
});

for (const [label, body, code, status] of [
  ['invalid UTF-8', new Uint8Array([0xc3, 0x28]), 'INVALID_JSON', 400],
  ['malformed JSON', '{"type":', 'INVALID_JSON', 400],
  ['multiple JSON values', '{} {}', 'INVALID_JSON', 400],
  ['duplicate root key', '{"type":"consultation","type":"booking","phone":"0500000011"}', 'DUPLICATE_JSON_KEY', 400],
  ['duplicate escaped nested key', '{"type":"booking","phone":"0500000011","name":"Тестове ім’я","selection":{"kind":"service","slug":"polishing","\\u0073lug":"ppf"}}', 'DUPLICATE_JSON_KEY', 400],
  ['non-object payload', '[]', 'PW001', 400],
  ['additional field', '{"type":"consultation","phone":"0500000011","price":1}', 'PW001', 400],
  ['non-string phone', '{"type":"consultation","phone":500000011}', 'PW001', 400],
  ['PostgreSQL-incompatible NUL', '{"type":"consultation","phone":"0500000011","question":"\\u0000"}', 'PW001', 400],
  ['unpaired surrogate', '{"type":"consultation","phone":"0500000011","question":"\\uD800"}', 'PW001', 400],
  ['unrecognized selection fields', '{"type":"booking","phone":"0500000011","name":"Тестове ім’я","selection":{"kind":"individual","id":"extra"}}', 'PW006', 422],
]) {
  test(label + ' is declined before the booking RPC', async () => {
    const { handler, calls } = fixture();
    await expectError(await handler(post({ body })), status, code);
    assert.deepEqual(calls, { admits: 1, writes: [] });
  });
}

test('JSON punctuation and escaped quotes inside string values remain data', async () => {
  const { handler, calls } = fixture();
  const request = { ...payload, question: 'Текст із символами {[,":]} та шляхом \\local' };
  assert.equal((await handler(post({ body: JSON.stringify(request) }))).status, 200);
  assert.deepEqual(calls.writes, [{ request, requestKey: key }]);
});

test('each retry consumes admission before using the same booking key', async () => {
  const { handler, calls } = fixture();
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await handler(post());
    assert.deepEqual(await response.json(), { success: true, booking_id: id });
  }
  assert.equal(calls.admits, 2);
  assert.deepEqual(calls.writes, [
    { request: payload, requestKey: key }, { request: payload, requestKey: key },
  ]);
});

test('an exhausted admission budget wins before invalid input and exposes Retry-After', async () => {
  const { handler, calls } = fixture({ admit: () => 23 });
  const response = await handler(post({ headers: { origin, 'content-type': 'text/plain' } }));
  await expectError(response, 429, 'HTTP_RATE_LIMITED');
  assert.equal(response.headers.get('retry-after'), '23');
  assert.equal(response.headers.get('access-control-expose-headers'), 'Retry-After');
  assert.deepEqual(calls, { admits: 1, writes: [] });
});

test('unavailable admission fails closed before reading or writing', async () => {
  const { handler, calls } = fixture({ admit: () => { throw new Error('Приватна помилка захисту'); } });
  await expectError(await handler(post({ body: 'invalid' })), 503, 'PW017');
  assert.deepEqual(calls, { admits: 1, writes: [] });
});

for (const [number, status] of [
  [1, 400], [2, 422], [3, 422], [4, 422], [5, 422], [6, 422], [7, 422], [8, 422],
  [9, 422], [10, 422], [11, 422], [12, 422], [13, 500], [14, 400], [15, 409],
  [16, 429], [17, 503],
]) {
  const code = 'PW' + String(number).padStart(3, '0');
  test(code + ' has a stable HTTP mapping without PostgREST internals', async () => {
    const secret = 'Тестове приватне значення';
    const { handler, logs } = fixture({
      create: () => ({ error: { code, message: secret, hint: secret, details: number === 16 ? '17' : secret } }),
    });
    const response = await handler(post({ headers: { origin } }));
    const body = await response.clone().text();
    await expectError(response, status, code);
    assert.equal(response.headers.get('retry-after'), number === 16 ? '17' : null);
    assert.equal(response.headers.get('access-control-allow-origin'), origin);
    assert.equal(body.includes(secret), false);
    assert.deepEqual(Object.keys(logs[0]).sort(), ['code', 'durationMs', 'requestId', 'stage', 'status']);
    assert.equal(JSON.stringify(logs).includes(secret), false);
    assert.equal(JSON.stringify(logs).includes(payload.phone), false);
    assert.equal(JSON.stringify(logs).includes(key), false);
  });
}

test('malformed retry details cannot become an HTTP header', async () => {
  const { handler } = fixture({ create: () => ({ error: { code: 'PW016', details: '17;x-injected: bad' } }) });
  const response = await handler(post());
  await expectError(response, 503, 'PW017');
  assert.equal(response.headers.get('retry-after'), null);
});

test('unknown upstream errors and non-UUID success bodies get a generic failure', async () => {
  for (const outcome of [{ error: { code: '42P01', message: 'Приватні дані' } }, { data: { id, marker: 'Приватні дані' } }]) {
    const { handler } = fixture({ create: () => outcome });
    await expectError(await handler(post()), 502, 'UPSTREAM_CONTRACT_ERROR');
  }
});

test('booking transport failure does not expose the private error, and admission is retained', async () => {
  const { handler, calls, logs } = fixture({
    create: () => { throw new Error('Приватний збій ' + payload.phone + key); },
  });
  await expectError(await handler(post()), 503, 'BACKEND_UNAVAILABLE');
  assert.equal(calls.admits, 1);
  assert.equal(calls.writes.length, 1);
  assert.equal(JSON.stringify(logs).includes(payload.phone), false);
  assert.equal(JSON.stringify(logs).includes(key), false);
});

test('the backend uses only the two fixed RPCs and its own credentials', async () => {
  const forwarded = [];
  const serverSecret = 'local-test-server-secret';
  const backend = createBookingBackend({
    supabaseUrl: 'http://127.0.0.1:54321',
    serverKey: serverSecret,
    legacyJwt: true,
    fetcher: async (target, options) => {
      forwarded.push({ target, options });
      return Response.json(target.pathname.endsWith('admit_booking_http_attempt') ? 0 : id);
    },
  });
  const handler = createBookingHandler({ backend, turnstileRequired: false });
  const response = await handler(post({
    headers: { authorization: 'Bearer browser-value', apikey: 'browser-key', 'x-forwarded-for': '203.0.113.9' },
  }));
  assert.equal(response.status, 200);
  assert.deepEqual(forwarded.map(({ target }) => target.pathname), [
    '/rest/v1/rpc/admit_booking_http_attempt', '/rest/v1/rpc/create_booking_request',
  ]);
  for (const { options } of forwarded) {
    assert.equal(options.headers.apikey, serverSecret);
    assert.equal(options.headers.authorization, 'Bearer ' + serverSecret);
    assert.equal(Object.hasOwn(options.headers, 'x-forwarded-for'), false);
    assert.equal(options.redirect, 'error');
  }
  assert.deepEqual(JSON.parse(forwarded[1].options.body), { p_request: payload, p_idempotency_key: key });
});

for (const target of ['admission', 'booking']) {
  test(target + ' backend timeout aborts the HTTP call and fails closed', async () => {
    const calls = [];
    const backend = createBookingBackend({
      supabaseUrl: 'http://127.0.0.1:54321',
      serverKey: 'local-test-server-secret',
      admissionTimeoutMs: 12,
      bookingTimeoutMs: 12,
      fetcher: async (url, { signal }) => {
        const isAdmission = url.pathname.endsWith('admit_booking_http_attempt');
        calls.push(isAdmission ? 'admission' : 'booking');
        if (isAdmission && target === 'booking') return Response.json(0);
        return new Promise((_resolve, reject) => {
          signal.addEventListener('abort', () => reject(signal.reason), { once: true });
        });
      },
    });
    const handler = createBookingHandler({ backend, turnstileRequired: false });
    const [response] = await Promise.all([handler(post()), pause(35)]);
    await expectError(response, 503, target === 'admission' ? 'PW017' : 'BACKEND_UNAVAILABLE');
    assert.deepEqual(calls, target === 'admission' ? ['admission'] : ['admission', 'booking']);
  });
}
