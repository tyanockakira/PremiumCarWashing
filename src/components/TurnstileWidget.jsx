import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { bookingMode } from '../lib/supabase';

const siteKey = import.meta.env?.VITE_TURNSTILE_SITE_KEY || '';
const scriptUrl = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let scriptPromise;

function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${scriptUrl}"]`);
      if (existing) {
        existing.addEventListener('load', () => resolve(window.turnstile), { once: true });
        existing.addEventListener('error', reject, { once: true });
        return;
      }
      const script = document.createElement('script');
      script.src = scriptUrl;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(window.turnstile);
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

const TurnstileWidget = forwardRef(function TurnstileWidget({ onToken, onError, disabled = false }, ref) {
  const container = useRef(null);
  const widgetId = useRef(null);
  const [loadError, setLoadError] = useState(false);

  useImperativeHandle(ref, () => ({
    reset() {
      if (widgetId.current != null && window.turnstile) window.turnstile.reset(widgetId.current);
      onToken('');
    },
  }), [onToken]);

  useEffect(() => {
    if (bookingMode === 'demo' || !siteKey || !container.current) return undefined;
    let active = true;
    loadTurnstile().then((turnstile) => {
      if (!active || !turnstile || !container.current) return;
      widgetId.current = turnstile.render(container.current, {
        sitekey: siteKey,
        theme: 'dark',
        callback: (token) => onToken(token),
        'expired-callback': () => onToken(''),
        'error-callback': () => { onToken(''); onError(); },
      });
    }).catch(() => {
      if (active) { setLoadError(true); onError(); }
    });
    return () => {
      active = false;
      if (widgetId.current != null && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = null;
    };
  }, [onError, onToken]);

  if (bookingMode === 'demo') return null;
  if (!siteKey || loadError) return <p className="turnstile-widget__error" role="alert">Перевірка захисту тимчасово недоступна.</p>;
  return <div className="turnstile-widget" ref={container} aria-busy={disabled || undefined} />;
});

export default TurnstileWidget;
