const maxBodyBytes = 16 * 1024;

export class BodyError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

// JSON.parse has already checked the grammar. Scan only string tokens and structural punctuation.
function hasDuplicateKeys(text) {
  const containers = [];
  let previous;
  for (const [token] of text.matchAll(/"(?:[^"\\]|\\[\s\S])*"|[{}\[\],:]/g)) {
    if (token === '{') containers.push(new Set());
    else if (token === '[') containers.push(null);
    else if (token === '}' || token === ']') containers.pop();
    else if (token === ':') {
      const key = JSON.parse(previous);
      const keys = containers.at(-1);
      if (keys.has(key)) return true;
      keys.add(key);
    }
    previous = token;
  }
  return false;
}

export async function readJsonBody(request, timeoutMs) {
  const declared = request.headers.get('content-length');
  if (declared !== null && !/^\d+$/.test(declared)) throw new BodyError('INVALID_CONTENT_LENGTH');
  if (declared !== null && Number(declared) > maxBodyBytes) throw new BodyError('BODY_TOO_LARGE');
  if (!request.body) throw new BodyError('INVALID_JSON');

  const reader = request.body.getReader();
  const bytes = new Uint8Array(maxBodyBytes);
  let length = 0;
  let expired = false;
  const timer = setTimeout(() => {
    expired = true;
    void reader.cancel().catch(() => {});
  }, timeoutMs);

  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (expired) throw new BodyError('BODY_READ_TIMEOUT');
      if (done) break;
      if (length + value.byteLength > maxBodyBytes) {
        void reader.cancel().catch(() => {});
        throw new BodyError('BODY_TOO_LARGE');
      }
      bytes.set(value, length);
      length += value.byteLength;
    }
  } catch (error) {
    if (error instanceof BodyError) throw error;
    throw new BodyError(expired ? 'BODY_READ_TIMEOUT' : 'INVALID_JSON');
  } finally {
    clearTimeout(timer);
    reader.releaseLock();
  }

  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes.subarray(0, length));
    const value = JSON.parse(text);
    if (hasDuplicateKeys(text)) throw new BodyError('DUPLICATE_JSON_KEY');
    return value;
  } catch (error) {
    if (error instanceof BodyError) throw error;
    throw new BodyError('INVALID_JSON');
  }
}
