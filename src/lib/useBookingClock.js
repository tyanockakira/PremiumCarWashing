import { useEffect, useState } from 'react';

export function useBookingClock(enabled) {
  const [, setMinute] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let timer;
    const schedule = () => {
      timer = setTimeout(refresh, 60_000 - Date.now() % 60_000);
    };
    const refresh = () => {
      clearTimeout(timer);
      setMinute(Math.floor(Date.now() / 60_000));
      schedule();
    };
    schedule();
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [enabled]);

  return new Date();
}
