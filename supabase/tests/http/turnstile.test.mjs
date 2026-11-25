import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createTurnstileVerifier } from '../../functions/submit-booking-request/turnstile.mjs';

const testSecret = '1x0000000000000000000000000000000AA';

test('Siteverify sends the server secret and accepts a successful response', async () => {
  let request;
  const verify = createTurnstileVerifier({
    secret: testSecret,
    fetcher: async (url, options) => {
      request = { url, options };
      return Response.json({ success: true });
    },
  });
  assert.deepEqual(await verify('test-token'), { success: true });
  assert.equal(request.url, 'https://challenges.cloudflare.com/turnstile/v0/siteverify');
  assert.deepEqual(JSON.parse(request.options.body), { secret: testSecret, response: 'test-token' });
  assert.equal(request.options.redirect, 'error');
});

test('Siteverify failure, transport errors, and missing secret fail closed', async () => {
  const rejected = createTurnstileVerifier({ secret: testSecret, fetcher: async () => Response.json({ success: false }) });
  assert.deepEqual(await rejected('test-token'), { success: false });

  const broken = createTurnstileVerifier({ secret: testSecret, fetcher: async () => { throw new Error('network'); } });
  assert.deepEqual(await broken('test-token'), { success: false, unavailable: true });

  const unconfigured = createTurnstileVerifier({ secret: '', fetcher: async () => assert.fail('must not call Siteverify') });
  assert.deepEqual(await unconfigured('test-token'), { success: false, unavailable: true });
});
