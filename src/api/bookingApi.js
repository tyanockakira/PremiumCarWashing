import { bookingApiUrl, bookingMode, getSupabase } from '../lib/supabase.js';
import { expiredBookingSlotMessage, getBookingDateError, isBookingSlotExpired, normalizeUkrainianPhone } from '../lib/bookingValidation.js';

const uuidPattern = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const requestError = 'Перевірте дані заявки й спробуйте ще раз.';
const unconfirmed = 'Підтвердження від сервера не надійшло. Заявку могло бути збережено. Спробуйте надіслати її ще раз із тими самими даними.';

const validationMessages = {
  PW002: 'Перевірте номер телефону.',
  PW003: 'Вкажіть ваше ім’я.',
  PW004: 'Скоротіть текст у полях заявки.',
  PW005: 'Приберіть недопустимі символи з полів заявки.',
  PW006: 'Оберіть послугу, пакет або індивідуальний підбір.',
  PW007: 'Ця послуга або пакет зараз недоступні. Оберіть інший варіант.',
  PW008: 'Цей клас автомобіля зараз недоступний. Оберіть інший варіант.',
  PW009: 'Перевірте бажану дату.',
  PW010: 'Оберіть дату від сьогодні до 90 днів наперед включно.',
  PW011: 'Оберіть бажаний час зі списку.',
  PW012: expiredBookingSlotMessage,
};

class BookingError extends Error {
  constructor(code, message, retryAt) {
    super(message);
    this.code = code;
    this.retryAt = retryAt;
  }
}

function endpoint(base) {
  try {
    const url = new URL(base);
    const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    if (url.protocol !== 'https:' && !(loopback && url.protocol === 'http:')) return null;
    if (url.username || url.password || url.search || url.hash || url.pathname !== '/') return null;
    return url.origin + '/functions/v1/submit-booking-request';
  } catch {
    return null;
  }
}

function payloadFor(type, { phone, name = '', car = '', question = '', selection, carClassId, date, slotId, comment = '' }) {
  if (type !== 'booking' && type !== 'consultation') throw new BookingError('PW001', requestError);
  const normalized = normalizeUkrainianPhone(phone ?? '');
  if (!normalized) throw new BookingError('PW002', validationMessages.PW002);
  const fields = { type, phone: normalized };
  if (name.trim()) fields.name = name.trim();
  if (car.trim()) fields.car = car.trim();

  if (type === 'consultation') {
    if (question.trim()) fields.question = question.trim();
    return fields;
  }

  if (!fields.name) throw new BookingError('PW003', validationMessages.PW003);
  if (selection?.kind === 'service' && selection.slug) {
    fields.selection = { kind: 'service', slug: selection.slug };
  } else if (selection?.kind === 'package' && uuidPattern.test(selection.id)) {
    fields.selection = { kind: 'package', id: selection.id };
  } else if (selection?.kind === 'individual') {
    fields.selection = { kind: 'individual' };
  } else {
    throw new BookingError('PW006', validationMessages.PW006);
  }
  if (carClassId) fields.carClassId = carClassId;
  if (date) fields.date = date;
  if (slotId) fields.slotId = slotId;
  if (comment.trim()) fields.comment = comment.trim();
  return fields;
}

function getRetryAt(header) {
  if (!header) return undefined;
  const now = Date.now();
  const date = /^\d+$/.test(header)
    ? now + Number(header) * 1000
    : /^[a-z]{3}, \d{2} [a-z]{3} \d{4} \d{2}:\d{2}:\d{2} GMT$/i.test(header) ? Date.parse(header) : NaN;
  return Number.isSafeInteger(date) && date > now && date <= 8.64e15 ? date : undefined;
}

function responseError(status, code, retryAt) {
  switch (status) {
    case 400: return new BookingError(code === 'PW014' ? code : 'PW001', requestError);
    case 403: return new BookingError('HTTP_403', 'Надсилання з цієї сторінки недоступне.');
    case 409: return new BookingError('PW015', 'За цим ключем уже надіслано заявку з іншими даними. Перевірте дані або зверніться до нас.');
    case 413: return new BookingError('HTTP_413', 'Заявка завелика. Скоротіть текст і спробуйте знову.');
    case 415: return new BookingError('HTTP_415', 'Сервер не підтримує формат заявки. Оновіть сторінку й спробуйте ще раз.');
    case 422: {
      const knownCode = Object.hasOwn(validationMessages, code) ? code : 'HTTP_422';
      return new BookingError(knownCode, validationMessages[knownCode] ?? requestError);
    }
    case 429: return new BookingError(
      'HTTP_429',
      retryAt ? 'Забагато запитів. Зачекайте, доки кнопка надсилання знову стане доступною.' : 'Забагато запитів. Спробуйте трохи пізніше.',
      retryAt,
    );
    case 503: return new BookingError('PW017', 'Сервіс тимчасово недоступний. Спробуйте пізніше з тими самими даними.');
    default: return new BookingError('UNCONFIRMED', unconfirmed);
  }
}

export function createBookingSubmission({
  mode = bookingMode,
  apiUrl = bookingApiUrl,
  fetchRequest = (...args) => fetch(...args),
  timeoutMs = 15_000,
} = {}) {
  let pending = false;
  let attempt;
  let rateError;

  async function send(type, draft) {
    try {
      if (rateError?.retryAt > Date.now()) throw rateError;
      const payload = payloadFor(type, draft);
      const body = JSON.stringify(payload);
      const sameRequest = body === attempt?.body;
      // A retry may recover an existing booking whose slot has since ended.
      const retryingUnconfirmed = sameRequest && attempt.uncertainSince !== undefined;
      if (!retryingUnconfirmed) {
        const now = new Date();
        const dateError = getBookingDateError(payload.date, now);
        if (dateError) throw new BookingError('INVALID_DATE', dateError);
        if (isBookingSlotExpired(payload.date, payload.slotId, now)) {
          throw new BookingError('PW012', expiredBookingSlotMessage);
        }
      } else if (Date.now() - attempt.uncertainSince >= 86_400_000) {
        throw new BookingError('RETRY_EXPIRED', 'Строк безпечного повторного надсилання минув. Зв’яжіться з нами, щоб уточнити стан заявки.');
      }
      if (mode === 'demo') {
        await new Promise((resolve) => setTimeout(resolve, 800));
        return { success: true, demo: true };
      }
      const url = endpoint(apiUrl);
      if (!url) throw new BookingError('NOT_CONFIGURED', 'Онлайн-форма тимчасово недоступна.');
      if (!sameRequest) {
        const bytes = globalThis.crypto.getRandomValues(new Uint8Array(32));
        const key = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
        attempt = { body, key };
      }
      const abort = new AbortController();
      const timeout = setTimeout(() => abort.abort(), timeoutMs);
      const startedAt = Date.now();
      try {
        const response = await fetchRequest(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Idempotency-Key': attempt.key },
          credentials: 'omit',
          redirect: 'error',
          body,
          signal: abort.signal,
        });
        if (response.status === 429) {
          response.body?.cancel().catch(() => {});
          rateError = responseError(429, undefined, getRetryAt(response.headers.get('Retry-After')));
          throw rateError;
        }

        const data = await response.json().catch(() => null);
        if (response.status !== 200) throw responseError(response.status, data?.code);
        if (data?.success !== true || typeof data.booking_id !== 'string' || !uuidPattern.test(data.booking_id)) {
          throw responseError(response.status);
        }
        attempt = undefined;
        return { success: true, booking_id: data.booking_id };
      } catch (error) {
        if (error instanceof BookingError && error.code !== 'UNCONFIRMED') throw error;
        attempt.uncertainSince ??= startedAt;
        throw new BookingError('UNCONFIRMED', unconfirmed);
      } finally {
        clearTimeout(timeout);
      }
    } catch (error) {
      throw error instanceof BookingError ? error : new BookingError('UNCONFIRMED', unconfirmed);
    } finally {
      pending = false;
    }
  }

  return (type, draft) => {
    if (pending) return null;
    pending = true;
    return send(type, draft);
  };
}

/**
 * Отримання активних послуг із бази даних
 */
export async function getServices() {
  try {
    const supabase = await getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.warn('Не вдалося завантажити послуги із Supabase. Використовується локальне джерело.');
      return null;
    }

    return data;
  } catch {
    console.warn('Помилка під час завантаження послуг.');
    return null;
  }
}

/**
 * Отримання тарифів і класів авто із бази даних
 */
export async function getPricingData() {
  try {
    const supabase = await getSupabase();
    if (!supabase) return null;

    const [classesRes, packagesRes] = await Promise.all([
      supabase.from('car_classes').select('*').order('sort_order', { ascending: true }),
      supabase.from('service_packages').select('*').eq('is_active', true).order('sort_order', { ascending: true })
    ]);

    if (classesRes.error || packagesRes.error) {
      console.warn('Не вдалося завантажити тарифи із Supabase.');
      return null;
    }

    return {
      carClasses: classesRes.data,
      packages: packagesRes.data
    };
  } catch {
    console.warn('Помилка під час завантаження тарифів.');
    return null;
  }
}
