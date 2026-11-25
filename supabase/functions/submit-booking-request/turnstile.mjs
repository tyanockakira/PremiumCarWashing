const siteverifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export function createTurnstileVerifier({ secret, fetcher = globalThis.fetch, timeoutMs = 5_000 }) {
  return async function verifyTurnstile(token) {
    if (!secret) return { success: false, unavailable: true };
    try {
      const response = await fetcher(siteverifyUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ secret, response: token }),
        signal: AbortSignal.timeout(timeoutMs),
        redirect: 'error',
      });
      if (!response.ok) return { success: false, unavailable: true };
      const result = await response.json();
      return { success: result?.success === true };
    } catch {
      return { success: false, unavailable: true };
    }
  };
}
