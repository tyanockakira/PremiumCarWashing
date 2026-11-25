import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as api from '../src/api/bookingApi.js';
import * as dates from '../src/lib/bookingValidation.js';
import { getBookingPreselection } from '../src/data/bookingOptions.js';

const apiUrl = 'http://127.0.0.1:54321';
const bookingId = 'f0000000-0000-4000-8000-000000000001';
const phone = '+380391000001';
const success = () => Response.json({ success: true, booking_id: bookingId });
const consultation = { type: 'consultation', phone };

function live(fetchRequest, options) {
  return api.createBookingSubmission({ mode: 'live', apiUrl, fetchRequest, turnstileRequired: false, ...options });
}

test('both forms send the protected HTTP contract and no browser credentials', async () => {
  const requests = [];
  const submit = live(async (url, options) => {
    requests.push([url, options]);
    return success();
  });
  assert.deepEqual(await submit('booking', {
    name: ' Тест ', phone: '039 100 00 01', car: ' Тестове авто ', date: '',
    selection: { kind: 'service', slug: 'polishing', price: 123 }, carClassId: 'suv',
    slotId: '21:00-00:00', comment: '', price: 456, service: 'Полірування',
  }), { success: true, booking_id: bookingId });
  await submit('consultation', { phone });
  const [[url, options], [, second]] = requests;
  assert.equal(url, apiUrl + '/functions/v1/submit-booking-request');
  assert.equal(options.method, 'POST');
  assert.equal(options.credentials, 'omit');
  assert.equal(options.redirect, 'error');
  assert.deepEqual(Object.keys(options.headers).sort(), ['Content-Type', 'Idempotency-Key']);
  assert.equal(options.headers['Content-Type'], 'application/json');
  assert.match(options.headers['Idempotency-Key'], /^[a-f0-9]{64}$/);
  assert.deepEqual(JSON.parse(options.body), {
    type: 'booking', phone, name: 'Тест', selection: { kind: 'service', slug: 'polishing' },
    carClassId: 'suv', car: 'Тестове авто', slotId: '21:00-00:00',
  });
  assert.deepEqual(JSON.parse(second.body), consultation);
});

test('live mode requires a Turnstile token and keeps idempotency across a token refresh', async () => {
  const requests = [];
  let calls = 0;
  const submit = api.createBookingSubmission({
    mode: 'live', apiUrl,
    fetchRequest: async (_url, options) => {
      requests.push(options);
      calls++;
      if (calls === 1) throw new TypeError('lost response');
      return success();
    },
  });
  await assert.rejects(submit('consultation', { phone }), { code: 'TURNSTILE_REQUIRED' });
  await assert.rejects(submit('consultation', { phone }, 'token-one'), { code: 'UNCONFIRMED' });
  const recovered = await submit('consultation', { phone }, 'token-two');
  assert.equal(recovered.booking_id, bookingId);
  assert.equal(requests[0].headers['Cf-Turnstile-Response'], 'token-one');
  assert.equal(requests[1].headers['Cf-Turnstile-Response'], 'token-two');
  assert.equal(requests[0].headers['Idempotency-Key'], requests[1].headers['Idempotency-Key']);
});

test('uncertain attempts keep the key for an equivalent draft and change it for a different draft', async () => {
  const keys = [];
  const submit = live(async (_url, options) => {
    keys.push(options.headers['Idempotency-Key']);
    throw new Error('sensitive upstream diagnostic');
  });
  for (const draft of [{ phone }, { phone: '039 100 00 01' }, { phone, question: 'Інше питання' }]) {
    await assert.rejects(submit('consultation', draft), (error) => {
      assert.equal(error.code, 'UNCONFIRMED');
      assert.match(error.message, /підтвердження/i);
      assert.doesNotMatch(error.message, /sensitive/);
      return true;
    });
  }
  assert.equal(keys[0], keys[1]);
  assert.notEqual(keys[0], keys[2]);
});

test('parallel submit is ignored while the first request is unresolved', async () => {
  let finish;
  let requests = 0;
  const submit = live(() => {
    requests++;
    return new Promise((resolve) => { finish = resolve; });
  });
  const first = submit('consultation', { phone });
  assert.equal(submit('consultation', { phone }), null);
  finish(success());
  assert.equal((await first).booking_id, bookingId);
  assert.equal(requests, 1);
});

for (const [status, code, expected, message] of [
  [400, 'PW001', 'PW001', /дані/],
  [403, 'ORIGIN_NOT_ALLOWED', 'HTTP_403', /недоступне/],
  [409, 'PW015', 'PW015', /ключем/],
  [413, 'BODY_TOO_LARGE', 'HTTP_413', /завелика/],
  [415, 'UNSUPPORTED_MEDIA_TYPE', 'HTTP_415', /формат/],
  [422, 'PW010', 'PW010', /90/],
  [500, 'PW013', 'UNCONFIRMED', /підтвердження/i],
  [503, 'PW017', 'PW017', /тимчасово/],
]) {
  test(`HTTP ${status} uses a safe Ukrainian message`, async () => {
    const submit = live(async () => Response.json({ success: false, code, message: 'sensitive details' }, { status }));
    await assert.rejects(submit('consultation', { phone }), (error) => {
      assert.equal(error.code, expected);
      assert.match(error.message, message);
      assert.doesNotMatch(error.message, /sensitive/);
      return true;
    });
  });
}

test('429 honors Retry-After and blocks another attempt even if the draft changed', async () => {
  let calls = 0;
  const submit = live(async () => {
    calls++;
    return new Response('', { status: 429, headers: { 'Retry-After': '30' } });
  });
  const start = Date.now();
  let retryAt;
  await assert.rejects(submit('consultation', { phone }), (error) => {
    assert.equal(error.code, 'HTTP_429');
    retryAt = error.retryAt;
    assert.ok(retryAt >= start + 30_000 && retryAt <= Date.now() + 30_000);
    return true;
  });
  await assert.rejects(submit('consultation', { phone, question: 'Інше' }), (error) => error.retryAt === retryAt);
  assert.equal(calls, 1);
});

test('an invalid Retry-After still renders HTTP 429 without a mandatory delay', async () => {
  const submit = live(async () => new Response('', { status: 429, headers: { 'Retry-After': '1.5' } }));
  await assert.rejects(submit('consultation', { phone }), (error) => error.code === 'HTTP_429' && !error.retryAt);
});

test('timeout during response body keeps the same key on manual retry', async () => {
  const keys = [];
  const submit = live(async (_url, { headers, signal }) => {
    keys.push(headers['Idempotency-Key']);
    if (keys.length === 2) return success();
    return new Response(new ReadableStream({
      start(controller) { signal.addEventListener('abort', () => controller.error(signal.reason)); },
    }), { headers: { 'Content-Type': 'application/json' } });
  }, { timeoutMs: 15 });
  await assert.rejects(submit('consultation', { phone }), { code: 'UNCONFIRMED' });
  assert.equal((await submit('consultation', { phone })).booking_id, bookingId);
  assert.equal(keys[0], keys[1]);
});

test('only a confirmed booking UUID counts as live success', async () => {
  const submit = live(async () => Response.json({ success: true, booking_id: 'not-a-uuid', demo: true }));
  await assert.rejects(submit('consultation', { phone }), { code: 'UNCONFIRMED' });
  const missing = live(() => assert.fail('unconfigured live mode must not fetch'), { apiUrl: '' });
  await assert.rejects(missing('consultation', { phone }), { code: 'NOT_CONFIGURED' });
  const demo = api.createBookingSubmission({ mode: 'demo', apiUrl, fetchRequest: () => assert.fail('demo must not fetch') });
  assert.deepEqual(await demo('consultation', { phone }), { success: true, demo: true });
});

test('uses the Kyiv calendar and accepts the 90th calendar day inclusively', () => {
  const beforeMidnight = new Date('2026-03-28T21:59:59Z');
  const midnight = new Date('2026-03-28T22:00:00Z');
  assert.deepEqual(dates.getBookingDateBounds(beforeMidnight), { min: '2026-03-28', max: '2026-06-26' });
  assert.deepEqual(dates.getBookingDateBounds(midnight), { min: '2026-03-29', max: '2026-06-27' });
  assert.equal(dates.getBookingDateError('', midnight), '');
  assert.equal(dates.getBookingDateError('2026-03-29', midnight), '');
  assert.equal(dates.getBookingDateError('2026-06-27', midnight), '');
  assert.notEqual(dates.getBookingDateError('2026-06-28', midnight), '');
  assert.notEqual(dates.getBookingDateError('2026-03-28', midnight), '');
  assert.notEqual(dates.getBookingDateError('2026-04-31', midnight), '');
  assert.equal(dates.getBookingDateBounds(new Date('2026-07-04T21:00Z')).min, '2026-07-05');
});

test('catalog preselection preserves package and class IDs, legacy labels and individual selection', async () => {
  const selections = [];
  const submit = live(async (_url, { body }) => {
    selections.push(JSON.parse(body));
    return success();
  });
  const cases = [
    [{ service: 'Ceramic Elite (Кросовер)' }, { kind: 'package', id: 'f0300000-0000-4000-8000-000000000002' }, 'crossover'],
    [{ service: 'Нова послуга', selection: { kind: 'service', slug: 'new-service' } }, { kind: 'service', slug: 'new-service' }],
    [{ service: 'Преміум-хімчистка салона' }, { kind: 'service', slug: 'interior' }],
    [{ service: 'Індивідуальний підбір із технологом' }, { kind: 'individual' }],
  ];
  for (const [state, selection, carClassId] of cases) {
    const option = getBookingPreselection(state);
    await submit('booking', { phone, name: 'Тест', selection: option.selection, carClassId: option.carClass?.id });
    const request = selections.at(-1);
    assert.deepEqual(request.selection, selection);
    assert.equal(request.carClassId, carClassId);
  }
});

test('Retry-After accepts an HTTP date and permits a manual retry after the deadline', async (t) => {
  const now = Date.parse('2026-11-25T20:00:00Z');
  t.mock.timers.enable({ apis: ['Date'], now });
  let calls = 0;
  const submit = live(async () => {
    calls++;
    return calls === 1
      ? new Response('', { status: 429, headers: { 'Retry-After': 'Wed, 25 Nov 2026 20:00:02 GMT' } })
      : success();
  });
  await assert.rejects(submit('consultation', { phone }), { retryAt: now + 2000 });
  t.mock.timers.tick(1999);
  await assert.rejects(submit('consultation', { phone }), { retryAt: now + 2000 });
  t.mock.timers.tick(1);
  assert.equal((await submit('consultation', { phone })).booking_id, bookingId);
  assert.equal(calls, 2);
});

test('a retry can recover yesterday’s result after Kyiv midnight but stops when idempotency expires', async (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: Date.parse('2026-11-25T21:59:59Z') });
  let calls = 0;
  const submit = live(async () => {
    calls++;
    throw new TypeError('network unavailable');
  });
  const draft = { phone, name: 'Тест', selection: { kind: 'individual' }, date: '2026-11-25' };
  await assert.rejects(submit('booking', draft), { code: 'UNCONFIRMED' });
  t.mock.timers.tick(1000);
  await assert.rejects(submit('booking', draft), { code: 'UNCONFIRMED' });
  await assert.rejects(submit('booking', { ...draft, name: 'Змінено' }), { code: 'INVALID_DATE' });
  t.mock.timers.tick(86_400_000 - 1000);
  await assert.rejects(submit('booking', draft), { code: 'RETRY_EXPIRED' });
  assert.equal(calls, 2);
});

test('a known failed booking is rejected locally at the exact Kyiv slot deadline', async (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: Date.parse('2026-07-06T08:59:59.999Z') });
  const payloads = [];
  const submit = live(async (_url, options) => {
    payloads.push(JSON.parse(options.body));
    return Response.json({ success: false, code: 'PW017' }, { status: 503 });
  });
  const draft = { phone, name: 'Тест', selection: { kind: 'individual' }, date: '2026-07-06', slotId: '10:00-12:00' };
  await assert.rejects(submit('booking', draft), { code: 'PW017' });
  t.mock.timers.tick(1);
  await assert.rejects(submit('booking', draft), { code: 'PW012' });
  await assert.rejects(submit('booking', { ...draft, car: 'Тестове авто' }), { code: 'PW012' });
  assert.equal(payloads.length, 1);
});

test('midnight slots, nights by arrangement, future dates, and undated preferences can be submitted', async (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: Date.parse('2026-11-25T21:59:59.999Z') });
  const payloads = [];
  const submit = live(async (_url, options) => {
    payloads.push(JSON.parse(options.body));
    return Response.json({ success: true, booking_id: bookingId });
  });
  const draft = { phone, name: 'Тест', selection: { kind: 'individual' } };
  for (const [date, slotId] of [
    ['2026-11-25', '21:00-00:00'], ['2026-11-25', 'night_by_arrangement'],
    ['2026-11-26', '10:00-12:00'], [undefined, '10:00-12:00'],
  ]) {
    await submit('booking', { ...draft, date, slotId });
  }
  t.mock.timers.tick(1);
  for (const slotId of ['21:00-00:00', 'night_by_arrangement']) {
    await assert.rejects(submit('booking', { ...draft, date: '2026-11-25', slotId }), { code: 'INVALID_DATE' });
  }
  assert.deepEqual(payloads.map(({ date, slotId }) => [date, slotId]), [
    ['2026-11-25', '21:00-00:00'], ['2026-11-25', 'night_by_arrangement'],
    ['2026-11-26', '10:00-12:00'], [undefined, '10:00-12:00'],
  ]);
});

test('a lost booking response can still be recovered with the original key after its slot ends', async (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: Date.parse('2026-11-25T09:59:59.999Z') });
  const keys = [];
  const submit = live(async (_url, options) => {
    keys.push(options.headers['Idempotency-Key']);
    if (keys.length === 1) throw new TypeError('network unavailable');
    return Response.json({ success: true, booking_id: bookingId });
  });
  const draft = { phone, name: 'Тест', selection: { kind: 'individual' }, date: '2026-11-25', slotId: '10:00-12:00' };
  await assert.rejects(submit('booking', draft), { code: 'UNCONFIRMED' });
  t.mock.timers.tick(1);
  const result = await submit('booking', draft);
  assert.equal(result.booking_id, bookingId);
  assert.ok(keys[0] && keys[0] === keys[1], 'retry preserves the idempotency key');
});
