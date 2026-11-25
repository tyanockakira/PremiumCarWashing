import { BodyError, readJsonBody } from './jsonBody.mjs';

const allowedOrigins = new Set([
  'https://premium-car-washing.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);
const endpointPaths = new Set(['/submit-booking-request', '/functions/v1/submit-booking-request']);
const corsRequestHeaders = new Set(['content-type', 'idempotency-key', 'cf-turnstile-response']);
const mediaType = /^application\/json(?:\s*;\s*charset\s*=\s*(?:"utf-8"|utf-8))?$/i;
const idempotencyKeyFormat = /^[0-9a-f]{64}$/;
const bookingIdFormat = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const consultationFields = new Set(['type', 'phone', 'name', 'car', 'question']);
const bookingFields = new Set(['type', 'phone', 'name', 'car', 'selection', 'carClassId', 'date', 'slotId', 'comment']);

const errors = {
  PW001: [400, 'Некоректна структура заявки.'],
  PW002: [422, 'Вкажіть коректний український номер телефону.'],
  PW003: [422, 'Вкажіть ваше ім’я.'],
  PW004: [422, 'Текст перевищує допустиму довжину.'],
  PW005: [422, 'Видаліть недопустимі символи з полів заявки.'],
  PW006: [422, 'Оберіть послугу, пакет або індивідуальний підбір.'],
  PW007: [422, 'Обрана послуга або пакет наразі недоступні.'],
  PW008: [422, 'Обраний клас автомобіля наразі недоступний.'],
  PW009: [422, 'Вкажіть дійсну календарну дату.'],
  PW010: [422, 'Оберіть дату в межах найближчих 90 календарних днів.'],
  PW011: [422, 'Оберіть доступний варіант часу.'],
  PW012: [422, 'Обраний часовий інтервал уже завершився.'],
  PW013: [500, 'Не вдалося зберегти заявку. Спробуйте ще раз.'],
  PW014: [400, 'Некоректний ключ повторного надсилання.'],
  PW015: [409, 'Цей ключ уже використано для заявки з іншими даними.'],
  PW016: [429, 'Забагато заявок. Спробуйте трохи пізніше.'],
  PW017: [503, 'Захист заявок тимчасово недоступний. Спробуйте пізніше.'],
  TURNSTILE_REQUIRED: [403, 'Перевірка захисту не пройшла. Оновіть сторінку і спробуйте ще раз.'],
  TURNSTILE_FAILED: [403, 'Перевірка захисту не пройшла. Спробуйте ще раз.'],
  TURNSTILE_UNAVAILABLE: [503, 'Сервіс перевірки тимчасово недоступний. Спробуйте ще раз.'],
  METHOD_NOT_ALLOWED: [405, 'Цей метод запиту не підтримується.'],
  ENDPOINT_NOT_FOUND: [404, 'Цей маршрут недоступний.'],
  ORIGIN_NOT_ALLOWED: [403, 'Цей сайт не має доступу до надсилання заявок.'],
  INVALID_PREFLIGHT: [400, 'Некоректний попередній запит.'],
  INVALID_CONTENT_LENGTH: [400, 'Некоректний розмір запиту.'],
  INVALID_JSON: [400, 'Не вдалося прочитати дані заявки.'],
  DUPLICATE_JSON_KEY: [400, 'Поля заявки не мають повторюватися.'],
  BODY_TOO_LARGE: [413, 'Розмір запиту перевищує 16 КіБ.'],
  BODY_READ_TIMEOUT: [408, 'Час читання заявки вичерпано.'],
  UNSUPPORTED_MEDIA_TYPE: [415, 'Надішліть заявку у форматі JSON без стиснення.'],
  HTTP_RATE_LIMITED: [429, 'Забагато спроб. Спробуйте трохи пізніше.'],
  BACKEND_UNAVAILABLE: [503, 'Сервіс заявок тимчасово недоступний. Спробуйте пізніше.'],
  UPSTREAM_CONTRACT_ERROR: [502, 'Не вдалося підтвердити збереження заявки. Спробуйте пізніше.'],
};

function jsonObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function safeText(value) {
  return typeof value === 'string' && !value.includes('\0') && value.isWellFormed();
}

function requestError(value) {
  if (!jsonObject(value) || (value.type !== 'booking' && value.type !== 'consultation')) return 'PW001';
  const allowed = value.type === 'booking' ? bookingFields : consultationFields;
  for (const [name, field] of Object.entries(value)) {
    if (!allowed.has(name) || (name !== 'selection' && field !== null && !safeText(field))) return 'PW001';
  }
  if (value.phone == null) return 'PW002';
  if (value.type === 'consultation') return null;
  if (value.name == null) return 'PW003';

  const selection = value.selection;
  if (!jsonObject(selection)) return 'PW006';
  const keys = Object.keys(selection);
  if (selection.kind === 'individual' && keys.length === 1) return null;
  if (selection.kind === 'service' && keys.length === 2 && safeText(selection.slug)) return null;
  if (selection.kind === 'package' && keys.length === 2 && safeText(selection.id)) return null;
  return 'PW006';
}

function retrySeconds(value) {
  if (typeof value === 'string' && /^\d+$/.test(value)) value = Number(value);
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}

export function createBookingHandler({ backend, log = () => {}, bodyTimeoutMs = 5_000, turnstileRequired = true, verifyTurnstile = async () => ({ success: false }) }) {
  return async function handle(request) {
    const requestId = crypto.randomUUID();
    const started = performance.now();
    const origin = request.headers.get('origin');
    const corsAllowed = origin !== null && allowedOrigins.has(origin);
    const headers = new Headers({ 'cache-control': 'no-store', vary: 'Origin' });

    if (corsAllowed) {
      headers.set('access-control-allow-origin', origin);
      headers.set('access-control-expose-headers', 'Retry-After');
    }

    function finish(status, code, stage, body) {
      try {
        log({ requestId, stage, status, code, durationMs: Math.round(performance.now() - started) });
      } catch {
        // Logging failure must not change the booking outcome.
      }
      return body === undefined ? new Response(null, { status, headers }) : Response.json(body, { status, headers });
    }

    function fail(code, stage, delay) {
      const [status, message] = errors[code];
      if (delay !== undefined) headers.set('retry-after', String(delay));
      return finish(status, code, stage, { success: false, code, message });
    }

    let admission;
    try {
      admission = await backend.admit();
    } catch {
      return fail('PW017', 'admission');
    }
    if (admission !== 0) {
      const delay = typeof admission === 'number' ? retrySeconds(admission) : null;
      return delay === null ? fail('PW017', 'admission') : fail('HTTP_RATE_LIMITED', 'admission', delay);
    }

    const url = new URL(request.url);
    if (!endpointPaths.has(url.pathname) || url.search) return fail('ENDPOINT_NOT_FOUND', 'request');

    if (request.method !== 'POST' && request.method !== 'OPTIONS') {
      headers.set('allow', 'POST, OPTIONS');
      return fail('METHOD_NOT_ALLOWED', 'request');
    }
    if (origin !== null && !corsAllowed) return fail('ORIGIN_NOT_ALLOWED', 'cors');

    if (request.method === 'OPTIONS') {
      headers.set('vary', 'Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
      const requestedMethod = request.headers.get('access-control-request-method');
      const requestedHeaders = request.headers.get('access-control-request-headers');
      const requestHeaders = requestedHeaders === null
        ? []
        : requestedHeaders.split(',').map((name) => name.trim().toLowerCase());
      if (!corsAllowed || requestedMethod !== 'POST' || requestHeaders.some((name) => !corsRequestHeaders.has(name))) {
        return fail('INVALID_PREFLIGHT', 'cors');
      }
      headers.set('access-control-allow-methods', 'POST');
      headers.set('access-control-allow-headers', 'Content-Type, Idempotency-Key, Cf-Turnstile-Response');
      headers.set('access-control-max-age', '300');
      return finish(204, 'PREFLIGHT_OK', 'cors');
    }

    const contentType = request.headers.get('content-type') ?? '';
    const encoding = request.headers.get('content-encoding');
    if (!mediaType.test(contentType) || (encoding !== null && encoding.toLowerCase() !== 'identity')) {
      return fail('UNSUPPORTED_MEDIA_TYPE', 'request');
    }

    const idempotencyKey = request.headers.get('idempotency-key');
    if (idempotencyKey === null || !idempotencyKeyFormat.test(idempotencyKey)) return fail('PW014', 'request');

    let payload;
    try {
      payload = await readJsonBody(request, bodyTimeoutMs);
    } catch (error) {
      return fail(error instanceof BodyError ? error.code : 'INVALID_JSON', 'body');
    }
    const shapeError = requestError(payload);
    if (shapeError) return fail(shapeError, 'request');

    if (turnstileRequired) {
      const token = request.headers.get('cf-turnstile-response');
      if (!token || token.length > 2048) return fail('TURNSTILE_REQUIRED', 'turnstile');
      let verification;
      try {
        verification = await verifyTurnstile(token);
      } catch {
        return fail('TURNSTILE_UNAVAILABLE', 'turnstile');
      }
      if (verification?.unavailable) return fail('TURNSTILE_UNAVAILABLE', 'turnstile');
      if (verification?.success !== true) return fail('TURNSTILE_FAILED', 'turnstile');
    }

    let result;
    try {
      result = await backend.create(payload, idempotencyKey);
    } catch {
      return fail('BACKEND_UNAVAILABLE', 'booking');
    }
    if (result?.error) {
      const { code, details } = result.error;
      if (code === 'PW016') {
        const delay = retrySeconds(details);
        return delay === null ? fail('PW017', 'booking') : fail(code, 'booking', delay);
      }
      if (typeof code === 'string' && /^PW0(?:0[1-9]|1[0-7])$/.test(code)) return fail(code, 'booking');
      return fail('UPSTREAM_CONTRACT_ERROR', 'booking');
    }
    if (typeof result?.data !== 'string' || !bookingIdFormat.test(result.data)) {
      return fail('UPSTREAM_CONTRACT_ERROR', 'booking');
    }
    return finish(200, 'BOOKING_OK', 'booking', { success: true, booking_id: result.data });
  };
}
