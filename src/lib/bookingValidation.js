export const latestBookingDate = '2099-12-31';

export function getBookingDateError(value, today) {
  if (!value) return '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'Вкажіть рік чотирма цифрами.';

  const date = new Date(value + 'T00:00:00Z');
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    return 'Такої дати немає. Перевірте день, місяць і рік.';
  }
  if (value < today) return 'Оберіть сьогоднішню або майбутню дату.';
  if (value > latestBookingDate) return 'Оберіть дату до 31 грудня 2099 року включно.';
  return '';
}

export function normalizeUkrainianPhone(value) {
  const compact = value.replace(/[\s().\-\u2010-\u2015]/g, '');
  const match = /^(?:0|(?:\+|00)?380)([3-9]\d{8})$/.exec(compact);
  return match ? '+380' + match[1] : '';
}
