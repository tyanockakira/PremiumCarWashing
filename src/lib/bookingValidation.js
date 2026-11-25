const kyivDate = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Kyiv' });
const kyivTime = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Kyiv', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

const slotEnds = new Map([
  ['10:00-12:00', '12:00'],
  ['12:00-15:00', '15:00'],
  ['15:00-18:00', '18:00'],
  ['18:00-21:00', '21:00'],
  ['21:00-00:00', '24:00'],
  ['15:00-19:00', '19:00'],
  ['19:00-23:00', '23:00'],
]);

export const expiredBookingSlotMessage = 'Цей часовий інтервал уже минув. Оберіть інший час.';

export function isBookingSlotExpired(date, slotId, now = new Date()) {
  const end = slotEnds.get(slotId);
  if (!date || !end) return false; // An undated request or a night shift by arrangement has no fixed deadline.
  const today = kyivDate.format(now);
  return date < today || (date === today && kyivTime.format(now) >= end);
}

export function getBookingDateBounds(now = new Date()) {
  const min = kyivDate.format(now);
  const end = new Date(min + 'T00:00:00Z');
  end.setUTCDate(end.getUTCDate() + 90);
  return { min, max: end.toISOString().slice(0, 10) };
}

export function getBookingDateError(value, now) {
  if (!value) return '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'Вкажіть рік чотирма цифрами.';

  const date = new Date(value + 'T00:00:00Z');
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    return 'Такої дати немає. Перевірте день, місяць і рік.';
  }
  const { min, max } = getBookingDateBounds(now);
  if (value < min) return 'Оберіть сьогоднішню або майбутню дату.';
  if (value > max) return 'Оберіть дату не більш ніж на 90 днів наперед.';
  return '';
}

export function normalizeUkrainianPhone(value) {
  const compact = value.replace(/[\s().\-\u2010-\u2015]/g, '');
  const match = /^(?:0|(?:\+|00)?380)([3-9]\d{8})$/.exec(compact);
  return match ? '+380' + match[1] : '';
}
