import { defaultCarClasses } from './carClasses.js';

export const bookingServices = [
  { id: 'polishing', label: 'Відновлювальне полірування' },
  { id: 'ceramic', label: 'Нанокераміка 9H Pro' },
  { id: 'interior', label: 'Преміум-хімчистка салону' },
  { id: 'ppf', label: 'Обклеювання поліуретаном PPF' },
].map(({ id, label }) => ({ id, label, selection: { kind: 'service', slug: id } }));

export const bookingPackages = [
  { id: 'f0300000-0000-4000-8000-000000000001', title: 'Executive Care' },
  { id: 'f0300000-0000-4000-8000-000000000002', title: 'Ceramic Elite' },
  { id: 'f0300000-0000-4000-8000-000000000003', title: 'Royal Perfection' },
].map(({ id, title }) => ({ id, title, label: title + ' (Комплекс)', selection: { kind: 'package', id } }));

export const individualBooking = {
  id: 'individual', label: 'Індивідуальний підбір із технологом', selection: { kind: 'individual' },
};

export function getBookingPreselection(state) {
  const service = typeof state?.service === 'string' ? state.service.trim() : '';
  const carClass = state?.carClass ?? defaultCarClasses.find(({ label }) => service.endsWith(' (' + label + ')'));
  const label = carClass && service.endsWith(' (' + carClass.label + ')')
    ? service.slice(0, -(carClass.label.length + 3)) : service;
  const selection = state?.selection;
  const options = [...bookingServices, ...bookingPackages, individualBooking];
  if (selection?.kind === 'service' && selection.slug) {
    return bookingServices.find((option) => option.id === selection.slug)
      ?? { id: 'service:' + selection.slug, label, selection };
  }
  if (selection?.kind === 'package' && selection.id) {
    const option = bookingPackages.find(({ id }) => id === selection.id);
    return { id: selection.id, label: label || option?.label, selection, carClass };
  }
  const option = options.find((item) => item.label === label || item.title === label)
    ?? (label === 'Преміум-хімчистка салона' ? bookingServices[2] : undefined);
  return option && { ...option, carClass };
}
