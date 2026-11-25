import { forwardRef, useCallback, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useIsPresent } from 'motion/react';
import { bookingMode } from '../lib/supabase';
import { normalizeUkrainianPhone } from '../lib/bookingValidation';
import { useBookingSubmission } from '../lib/useBookingSubmission';
import { duration, easeGlide } from '../lib/motion';
import { ArrowRightIcon, CheckIcon, CloseIcon } from './Icons';
import { useDetailReducedMotion } from './useDetailReducedMotion';
import TurnstileWidget from './TurnstileWidget';
import './BookingEntryModal.css';

const choices = [
  { title: 'Онлайн-запис', description: 'Оберіть послугу та зручний час візиту.' },
  { title: 'Консультація', description: 'Залиште номер телефону для зв’язку зі спеціалістом.' },
];
const demoNotice = 'Демонстраційний режим. Реальний дзвінок не здійснюється.';
const isDemo = bookingMode === 'demo';
const contentVariants = {
  enter: (direction) => ({ x: 14 * direction, opacity: 0 }),
  active: { x: 0, opacity: 1 },
  exit: (direction) => ({ x: -14 * direction, opacity: 0 }),
};

function lockBackground(dialog) {
  const root = document.documentElement;
  const scroll = { top: window.scrollY, left: window.scrollX, behavior: 'instant' };
  const pathname = window.location.pathname;
  root.style.setProperty('--entry-scrollbar', window.innerWidth - root.clientWidth + 'px');
  root.classList.add('booking-entry-open');

  const viewport = window.visualViewport;
  const fitViewport = () => {
    if (!viewport) return;
    dialog.style.setProperty('--entry-viewport-top', viewport.offsetTop + 'px');
    dialog.style.setProperty('--entry-viewport-left', viewport.offsetLeft + 'px');
    dialog.style.setProperty('--entry-viewport-width', viewport.width + 'px');
    dialog.style.setProperty('--entry-viewport-height', viewport.height + 'px');
  };
  fitViewport();
  viewport?.addEventListener('resize', fitViewport);
  viewport?.addEventListener('scroll', fitViewport);

  return () => {
    viewport?.removeEventListener('resize', fitViewport);
    viewport?.removeEventListener('scroll', fitViewport);
    root.classList.remove('booking-entry-open');
    root.style.removeProperty('--entry-scrollbar');
    if (window.location.pathname === pathname) window.scrollTo(scroll);
  };
}

const EntryContent = forwardRef(function EntryContent({ direction, reduce, label, title, description, children }, ref) {
  const present = useIsPresent();

  return (
    <motion.div
      className="booking-entry__content"
      ref={ref}
      inert={!present}
      custom={direction}
      variants={contentVariants}
      initial={reduce ? false : 'enter'}
      animate="active"
      exit={reduce ? undefined : 'exit'}
      transition={{ duration: reduce ? 0 : duration.dialogStep, ease: easeGlide }}
    >
      <p className="cinema-label booking-entry__label">{label}</p>
      <h2 className="cinema-heading booking-entry__title" tabIndex={-1}>
        <motion.span
          initial={reduce ? false : { y: '90%' }}
          animate={{ y: 0 }}
          transition={{ duration: reduce ? 0 : duration.dialogStep, ease: easeGlide }}
        >
          {title}
        </motion.span>
      </h2>
      <p className="booking-entry__description">{description}</p>
      {children}
    </motion.div>
  );
});

function EntrySession({ initialMode, reduce, onClose, onChooseBooking }) {
  const [mode, setMode] = useState(initialMode);
  const [direction, setDirection] = useState(1);
  const [phone, setPhone] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const { submit: send, sending, error, waiting, clearError } = useBookingSubmission();
  const stage = useRef(null);
  const phoneField = useRef(null);
  const turnstileRef = useRef(null);
  const handleTurnstileToken = useCallback((token) => setTurnstileToken(token), []);
  const handleTurnstileError = useCallback(() => setTurnstileToken(''), []);

  useLayoutEffect(() => {
    const container = stage.current;
    const active = container.querySelector('.booking-entry__content:not([inert])');
    active.querySelector('.booking-entry__title').focus({ preventScroll: true });
    container.closest('.booking-entry__panel').scrollTop = 0;

    const measure = () => container.style.setProperty('--entry-content-height', active.offsetHeight + 'px');
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(active);
    return () => observer.disconnect();
  }, [mode]);

  function changeMode(nextMode, nextDirection) {
    setInvalid(false);
    clearError();
    setDirection(nextDirection);
    setMode(nextMode);
  }

  async function submit(event) {
    event.preventDefault();
    if (sending || waiting) return;

    const normalized = normalizeUkrainianPhone(phone);
    if (!normalized) {
      setInvalid(true);
      phoneField.current.focus();
      return;
    }

    let result;
    try {
      result = await send('consultation', { phone: normalized }, turnstileToken);
    } finally {
      turnstileRef.current?.reset();
    }
    if (result) {
      setPhone('');
      changeMode('complete', 1);
    }
  }

  const content = { direction, reduce };

  return (
    <>
      <div className="booking-entry__bar">
        {mode === 'consultation' ? (
          <button className="booking-entry__back" type="button" disabled={sending} onClick={() => changeMode('choice', -1)}>
            <ArrowRightIcon size={18} /> Назад
          </button>
        ) : (
          <div className="brand-lockup booking-entry__brand">
            <img src="/brand/mark.svg" alt="" width="70" height="46" />
            <span className="brand-lockup__wordmark">PremiumWash</span>
          </div>
        )}
        <button className="booking-entry__close" type="button" aria-label="Закрити вікно" onClick={onClose}>
          <CloseIcon size={22} />
        </button>
      </div>

      <div className="booking-entry__stage" ref={stage}>
        <AnimatePresence initial={false} mode="popLayout" custom={direction}>
          {mode === 'choice' && (
            <EntryContent
              key="choice"
              {...content}
              label="Персональний догляд"
              title="Оберіть формат звернення"
              description="Як ми можемо допомогти вашому автомобілю?"
            >
              <ul className="booking-entry__choices" role="list">
                {choices.map(({ title, description }, index) => (
                  <li
                    key={title}
                    style={{ '--entry-option-delay': index * duration.dialogStagger + 's' }}
                  >
                    <button
                      type="button"
                      className="booking-entry__choice"
                      onClick={index === 0 ? onChooseBooking : () => changeMode('consultation', 1)}
                    >
                      <span className="booking-entry__number" aria-hidden="true">0{index + 1}</span>
                      <span className="booking-entry__choice-copy">
                        <strong>{title}</strong>
                        <span>{description}</span>
                      </span>
                      <ArrowRightIcon size={20} className="cinema-arrow" />
                    </button>
                  </li>
                ))}
              </ul>
            </EntryContent>
          )}
          {mode === 'consultation' && (
            <EntryContent
              key="consultation"
              {...content}
              label="Консультація"
              title="Обговорімо ваше авто"
              description="Залиште номер телефону, щоб отримати консультацію щодо догляду за вашим автомобілем."
            >
              <form className="booking-entry__form" onSubmit={submit} noValidate aria-busy={sending || undefined}>
                <div className="booking-entry__field">
                  <label htmlFor="booking-entry-phone">Номер телефону *</label>
                  <input
                    id="booking-entry-phone"
                    ref={phoneField}
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+380 XX XXX XX XX"
                    required
                    readOnly={sending}
                    value={phone}
                    aria-invalid={invalid || undefined}
                    aria-describedby={invalid ? 'booking-entry-phone-error' : 'booking-entry-mode'}
                    onChange={(event) => {
                      setPhone(event.target.value);
                      setInvalid(false);
                      clearError();
                    }}
                  />
                  {invalid && (
                    <p id="booking-entry-phone-error" className="booking-entry__error" role="alert">
                      Вкажіть український номер, наприклад 067 123 45 67 або +380 67 123 45 67.
                    </p>
                  )}
                </div>
                {error && (
                  <p className="booking-entry__error" role="alert">{error}</p>
                )}
                {!isDemo && <TurnstileWidget ref={turnstileRef} onToken={handleTurnstileToken} onError={handleTurnstileError} disabled={sending} />}
                <button
                  type="submit"
                  className="btn-platinum cinema-button"
                  aria-disabled={sending || waiting || undefined}
                >
                  {sending ? 'Надсилаємо запит…' : 'Замовити дзвінок'}
                </button>
                <p id="booking-entry-mode" className="booking-entry__notice">
                  {isDemo ? demoNotice : 'Для консультації достатньо номера телефону.'}
                </p>
              </form>
            </EntryContent>
          )}
          {mode === 'complete' && (
            <EntryContent
              key="complete"
              {...content}
              label="Консультація"
              title="Запит прийнято"
              description={isDemo ? 'Демонстраційний запит успішно оформлено. Реальний дзвінок не здійснюється.' : 'Запит на консультацію збережено. Ми зв’яжемося з вами за вказаним номером.'}
            >
              <CheckIcon size={32} className="motion-check booking-entry__check" />
              <button className="btn-platinum cinema-button" type="button" onClick={onClose}>Готово</button>
            </EntryContent>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

export default function BookingEntryModal({ session, onClose, onChooseBooking, onAfterClose }) {
  const reduce = useDetailReducedMotion();
  const dialog = useRef(null);
  const restoreTo = useRef(null);
  const unlock = useRef(null);
  const requestedOpen = useRef(false);
  const pressedBackdrop = useRef(false);
  const sessionId = session?.id;
  const opener = session?.opener;

  useLayoutEffect(() => {
    requestedOpen.current = sessionId != null;
    if (!requestedOpen.current) return;

    const element = dialog.current;
    if (!element.open) {
      restoreTo.current = opener ?? document.activeElement;
      unlock.current = lockBackground(element);
      element.showModal();
    }
    element.querySelector('.booking-entry__title')?.focus({ preventScroll: true });
  }, [sessionId, opener]);

  useLayoutEffect(() => {
    const element = dialog.current;
    return () => {
      if (element.open) element.close();
      unlock.current?.();
      unlock.current = null;
    };
  }, []);

  function finishClosing() {
    if (requestedOpen.current || !dialog.current.open) return;
    dialog.current.close();
    unlock.current?.();
    unlock.current = null;
    onAfterClose(restoreTo.current);
    restoreTo.current = null;
  }

  function keepFocusInside(event) {
    if (event.key !== 'Tab') return;
    const targets = [...dialog.current.querySelectorAll('button:not(:disabled), input:not(:disabled)')]
      .filter((element) => !element.closest('[inert]') && element.getClientRects().length > 0);
    const first = targets[0];
    const last = targets.at(-1);
    const active = document.activeElement;
    const destination = event.shiftKey
      ? (active === first || !targets.includes(active)) && last
      : active === last && first;
    if (destination) {
      event.preventDefault();
      destination.focus();
    }
  }

  return (
    <dialog
      id="booking-entry-dialog"
      className="booking-entry"
      ref={dialog}
      aria-label="Запис і консультація"
      aria-modal="true"
      onCancel={(event) => {
        event.preventDefault();
        if (session) onClose();
      }}
      onKeyDown={keepFocusInside}
      onPointerDown={(event) => { pressedBackdrop.current = event.target === event.currentTarget; }}
      onClick={(event) => {
        if (session && pressedBackdrop.current && event.target === event.currentTarget) onClose();
        pressedBackdrop.current = false;
      }}
    >
      <AnimatePresence onExitComplete={finishClosing}>
        {session && (
          <motion.div
            key="scrim"
            className="booking-entry__scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: duration.dialogClose, ease: easeGlide } }}
            transition={{ duration: duration.dialogBackdrop, ease: easeGlide }}
          />
        )}
        {session && (
          <motion.div
            key="panel"
            className="booking-entry__panel"
            style={{
              '--entry-open-duration': duration.dialogOpen + 's',
              '--entry-step-duration': duration.dialogStep + 's',
            }}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{
              opacity: 0,
              scale: reduce ? 1 : 0.98,
              y: reduce ? 0 : 6,
              transition: { duration: duration.dialogClose, ease: easeGlide },
            }}
            transition={{ duration: duration.dialogOpen, ease: easeGlide }}
          >
            <EntrySession
              key={session.id}
              initialMode={session.initialMode}
              reduce={reduce}
              onClose={onClose}
              onChooseBooking={onChooseBooking}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </dialog>
  );
}
