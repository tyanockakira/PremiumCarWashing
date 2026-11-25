export function createBookingBackend({
  supabaseUrl,
  serverKey,
  legacyJwt = false,
  fetcher = globalThis.fetch,
  admissionTimeoutMs = 2_000,
  bookingTimeoutMs = 5_000,
}) {
  async function rpc(name, body, timeoutMs) {
    if (!supabaseUrl || !serverKey) throw new Error('Booking backend is unavailable.');
    const headers = {
      apikey: serverKey,
      'content-type': 'application/json',
      ...(legacyJwt ? { authorization: 'Bearer ' + serverKey } : {}),
    };
    const response = await fetcher(new URL('/rest/v1/rpc/' + name, supabaseUrl), {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
      redirect: 'error',
    });
    return { ok: response.ok, payload: await response.json() };
  }

  return {
    async admit() {
      const { ok, payload } = await rpc('admit_booking_http_attempt', {}, admissionTimeoutMs);
      if (!ok) throw new Error('HTTP admission is unavailable.');
      return payload;
    },
    async create(request, idempotencyKey) {
      const { ok, payload } = await rpc('create_booking_request', {
        p_request: request,
        p_idempotency_key: idempotencyKey,
      }, bookingTimeoutMs);
      return ok
        ? { data: payload }
        : { error: { code: payload?.code, details: payload?.details } };
    },
  };
}
