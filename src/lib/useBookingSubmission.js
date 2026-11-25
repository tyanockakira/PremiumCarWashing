import { useEffect, useRef, useState } from 'react';

export function useBookingSubmission() {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [retryAt, setRetryAt] = useState(0);
  const pending = useRef(false);
  const submission = useRef(null);

  useEffect(() => {
    if (!retryAt) return;
    let timer;
    const wait = () => {
      const remaining = retryAt - Date.now();
      if (remaining > 0) {
        timer = setTimeout(wait, Math.min(remaining, 2_147_483_647));
      } else {
        setRetryAt(0);
        setError('');
      }
    };
    timer = setTimeout(wait, Math.min(Math.max(0, retryAt - Date.now()), 2_147_483_647));
    return () => clearTimeout(timer);
  }, [retryAt]);

  function clearError() {
    if (!retryAt) setError('');
  }

  async function submit(type, draft) {
    if (pending.current || retryAt > Date.now()) return null;
    pending.current = true;
    setSending(true);
    setError('');
    setRetryAt(0);
    try {
      if (!submission.current) {
        const api = await import('../api/bookingApi.js').catch(() => null);
        if (!api) {
          setError('Не вдалося завантажити форму надсилання. Спробуйте ще раз.');
          return null;
        }
        submission.current = api.createBookingSubmission();
      }
      return await submission.current(type, draft);
    } catch (failure) {
      setError(failure?.message ?? 'Підтвердження від сервера не надійшло. Спробуйте ще раз із тими самими даними.');
      setRetryAt(failure?.retryAt ?? 0);
      return null;
    } finally {
      pending.current = false;
      setSending(false);
    }
  }

  return { submit, sending, error, waiting: Boolean(retryAt), clearError };
}
