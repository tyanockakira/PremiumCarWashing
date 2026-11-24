import { useSyncExternalStore } from 'react';

const preference = '(prefers-reduced-motion: reduce)';

function subscribe(onChange) {
  const media = window.matchMedia(preference);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

function getPreference() {
  return window.matchMedia(preference).matches;
}

export function useDetailReducedMotion() {
  return useSyncExternalStore(subscribe, getPreference, () => false);
}
