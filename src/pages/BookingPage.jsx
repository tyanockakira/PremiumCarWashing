import { forwardRef, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useIsPresent } from 'motion/react';
import { bookingMode } from '../lib/supabase';
import { defaultCarClasses } from '../data/carClasses';
import { bookingPackages, bookingServices, getBookingPreselection, individualBooking } from '../data/bookingOptions';
import {
  ArrowRightIcon, CarIcon, CheckIcon, InfoIcon, LogoEmblem,
  MessageSquareIcon, ShieldCheckIcon, ShieldIcon, ZapIcon,
} from '../components/Icons';
import { useDetailReducedMotion } from '../components/useDetailReducedMotion';
import { duration, easeGlide } from '../lib/motion';
import { expiredBookingSlotMessage, getBookingDateBounds, getBookingDateError, isBookingSlotExpired, normalizeUkrainianPhone } from '../lib/bookingValidation';
import { useBookingClock } from '../lib/useBookingClock';
import { useBookingSubmission } from '../lib/useBookingSubmission';
import headlightPhoto from '../assets/premiumwash/booking-headlight.webp';
import { responsiveImages } from '../data/responsiveImages';
import './BookingPage.css';

const serviceCards = {
  polishing: { title: 'Полірування кузова', icon: LogoEmblem },
  ceramic: { title: 'Захисне покриття', icon: ShieldCheckIcon },
  interior: { title: 'Догляд за салоном', icon: CarIcon },
  ppf: { title: 'Обклеювання PPF', detail: 'Поліуретанова плівка', icon: ShieldIcon },
};

const defaultExtras = [...bookingPackages, individualBooking];
const timeSlots = [
  ['10:00-12:00', 'Ранок'],
  ['12:00-15:00', 'День'],
  ['15:00-18:00', 'День'],
  ['18:00-21:00', 'Вечір'],
  ['21:00-00:00', 'Нічна зміна'],
].map(([id, label]) => ({ id, label, time: id.replace('-', ' — ') }));

const steps = [
  { label: 'Послуга', title: 'Оберіть послугу', description: 'Одна послуга або один пакет догляду на заявку.' },
  { label: 'Автомобіль', title: 'Ваш автомобіль', description: 'Вкажіть клас і модель, якщо знаєте їх.' },
  { label: 'Дата і час', title: 'Оберіть дату і час', description: 'Зазначте бажаний час. Деталі візиту узгоджуються окремо.' },
  { label: 'Контактні дані', title: 'Ваші контактні дані', description: 'Заповніть контакти й перевірте параметри заявки нижче.' },
];

const stepMotion = {
  enter: (direction) => ({ x: direction * 16, opacity: 0.5 }),
  active: { x: 0, opacity: 1 },
  exit: (direction) => ({
    x: direction * -16,
    opacity: 0,
    transition: { duration: duration.step * 0.5, ease: easeGlide },
  }),
};

function makeDraft(preselection) {
  return {
    service: preselection?.id ?? bookingServices[0].id,
    carClass: preselection?.carClass?.id ?? '',
    car: '',
    date: '',
    timeSlot: timeSlots[0].id,
    name: '',
    phone: '',
    comment: '',
  };
}

function BookingSummary({ draft, serviceLabel, classLabel, reduce, slotExpired, complete = false }) {
  const date = draft.date ? draft.date.split('-').reverse().join('.') : 'Дата не вказана';
  const time = slotExpired ? 'Час не обрано' : timeSlots.find(({ id }) => id === draft.timeSlot)?.time;
  const summary = [
    ['Послуга', serviceLabel],
    ['Автомобіль', [draft.car.trim(), classLabel].filter(Boolean).join(' · ') || 'Не вказано'],
    ['Дата і час', [date, time].filter(Boolean).join(' · ')],
  ];

  return (
    <section className="booking-summary" aria-label={complete ? 'Підсумок заявки' : 'Параметри запису'}>
      <h3>{complete ? 'Підсумок заявки' : 'Параметри запису'}</h3>
      <dl>
        {summary.map(([label, value]) => (
          <div className="booking-summary__item" key={label}>
            <dt>{label}</dt>
            <motion.dd
              key={value}
              initial={reduce ? false : { opacity: 0.7 }}
              animate={{ opacity: 1 }}
              transition={{ duration: reduce ? 0 : duration.feedback, ease: easeGlide }}
            >
              {value}
            </motion.dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

const BookingStep = forwardRef(function BookingStep({ step, direction, reduce, children }, ref) {
  const isPresent = useIsPresent();
  return (
    <motion.section
      ref={ref}
      className="booking-step"
      aria-labelledby={'booking-step-' + step}
      inert={!isPresent}
      custom={direction}
      variants={stepMotion}
      initial={reduce ? false : 'enter'}
      animate="active"
      exit={reduce ? undefined : 'exit'}
      transition={{ duration: reduce ? 0 : duration.step, ease: easeGlide }}
    >
      <h2 className="cinema-heading" tabIndex={-1} id={'booking-step-' + step}>{steps[step].title}</h2>
      <p className="booking-step__description">{steps[step].description}</p>
      {children}
    </motion.section>
  );
});

function BookingField({ name, label, error, multiline = false, ...props }) {
  const id = 'booking-' + name;
  const attributes = {
    id, name, ...props,
    'data-filled': Boolean(props.value?.trim()),
    'aria-invalid': Boolean(error) || undefined,
    'aria-describedby': error ? id + '-error' : undefined,
  };
  return (
    <div className="booking-field">
      <label htmlFor={id}>{label}</label>
      {multiline ? <textarea rows={3} {...attributes} /> : <input {...attributes} />}
      {error && <p className="booking-field__error" id={id + '-error'}>{error}</p>}
    </div>
  );
}

export default function BookingPage({ onOpenConsultation }) {
  const { state } = useLocation();
  const preselection = getBookingPreselection(state);
  const [draft, setDraft] = useState(() => makeDraft(preselection));
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [errors, setErrors] = useState({});
  const [result, setResult] = useState(null);
  const { submit, sending: isSubmitting, error: submitError, waiting, clearError } = useBookingSubmission();
  const focusStep = useRef(false);
  const panel = useRef(null);
  const stage = useRef(null);
  const reduce = useDetailReducedMotion();
  const isDemo = bookingMode === 'demo';
  const scheduleNow = useBookingClock(step === 2);
  const dateBounds = step === 2 ? getBookingDateBounds(scheduleNow) : null;
  const selectedService = bookingServices.find(({ id }) => id === draft.service);
  const extraServices = preselection && !bookingServices.some(({ id }) => id === preselection.id)
    ? [preselection, ...defaultExtras.filter(({ id }) => id !== preselection.id)] : defaultExtras;
  const selectedOption = selectedService ?? extraServices.find(({ id }) => id === draft.service);
  const preselectedClass = preselection?.carClass;
  const carClasses = preselectedClass && !defaultCarClasses.some(({ id }) => id === preselectedClass.id)
    ? [...defaultCarClasses, preselectedClass] : defaultCarClasses;
  const summary = {
    serviceLabel: serviceCards[draft.service]?.detail ?? selectedOption?.label,
    classLabel: carClasses.find(({ id }) => id === draft.carClass)?.label,
  };

  useLayoutEffect(() => {
    const container = stage.current;
    const activeStep = container?.querySelector('.booking-step:not([inert])');
    if (!activeStep) return;

    const fitStage = () => container.style.setProperty('--stage-height', activeStep.offsetHeight + 'px');
    fitStage();
    const observer = new ResizeObserver(fitStage);
    observer.observe(activeStep);
    return () => observer.disconnect();
  }, [step, result]);

  useEffect(() => {
    if (!focusStep.current) return;
    focusStep.current = false;
    const heading = panel.current?.querySelector(result ? '#booking-result' : '#booking-step-' + step);
    heading?.focus({ preventScroll: true });
    if (heading && (heading.getBoundingClientRect().top < 92 || heading.getBoundingClientRect().bottom > window.innerHeight)) {
      heading.scrollIntoView({ block: 'start', behavior: 'instant' });
    }
  }, [step, result]);

  function update(name, value) {
    setDraft((current) => ({ ...current, [name]: value }));
    setErrors((current) => name === 'date' ? { ...current, date: '', timeSlot: '' } : { ...current, [name]: '' });
    clearError();
  }

  function goTo(nextStep) {
    focusStep.current = true;
    setDirection(nextStep < step ? -1 : 1);
    setErrors({});
    clearError();
    setStep(nextStep);
  }

  function validate(phone) {
    if (step === 0 && !selectedOption) return { service: 'Оберіть послугу або пакет.' };
    if (step === 1 && draft.carClass && !carClasses.some(({ id }) => id === draft.carClass)) {
      return { carClass: 'Оберіть клас зі списку.' };
    }
    if (step === 2) {
      const field = stage.current.querySelector('.booking-step:not([inert]) #booking-date');
      if (field?.validity.badInput) {
        return { date: 'Вкажіть дійсну календарну дату або залиште поле порожнім.' };
      }
      const now = new Date();
      const dateError = getBookingDateError(draft.date, now);
      if (dateError) return { date: dateError };
      if (!timeSlots.some(({ id }) => id === draft.timeSlot)) return { timeSlot: 'Оберіть бажаний час.' };
      if (isBookingSlotExpired(draft.date, draft.timeSlot, now)) return { timeSlot: expiredBookingSlotMessage };
    }
    if (step === 3) {
      const contactErrors = {};
      if (!draft.name.trim()) contactErrors.name = 'Вкажіть ваше ім’я.';
      if (!phone) {
        contactErrors.phone = 'Вкажіть український номер, наприклад 067 123 45 67 або +380 67 123 45 67.';
      }
      return contactErrors;
    }
    return {};
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting || (waiting && step === steps.length - 1)) return;

    const phone = step === steps.length - 1 ? normalizeUkrainianPhone(draft.phone) : '';
    const invalid = validate(phone);
    const firstInvalid = Object.keys(invalid)[0];
    if (firstInvalid) {
      setErrors(invalid);
      stage.current?.querySelector('.booking-step:not([inert]) [name="' + firstInvalid + '"]:not(:disabled)')?.focus();
      return;
    }
    if (step < steps.length - 1) {
      goTo(step + 1);
      return;
    }
    const response = await submit('booking', {
      ...draft, phone, selection: selectedOption?.selection, carClassId: draft.carClass, slotId: draft.timeSlot,
    });
    if (response) {
      focusStep.current = true;
      setResult(response);
    }
  }

  function reset() {
    setDraft(makeDraft());
    setResult(null);
    goTo(0);
  }

  const fieldProps = (name) => ({
    name, value: draft[name], error: errors[name],
    onChange: (event) => update(name, event.target.value),
  });

  return (
    <section className="booking-page" aria-labelledby="booking-title">
      <div className="cinema-container booking-page__layout">
        <aside className="booking-intro">
          <div className="booking-intro__copy">
            <p className="cinema-label"><span aria-hidden="true">06 / </span>Онлайн-запис</p>
            <h1 className="cinema-heading" id="booking-title" tabIndex={-1}>Запис на<br /> дітейлінг</h1>
            <p>Оберіть догляд для свого авто та залиште заявку на зручний для вас час.</p>
            <Link
              className="booking-intro__link"
              to="?mode=consultation"
              state={state}
              aria-haspopup="dialog"
              aria-controls="booking-entry-dialog"
              onClick={(event) => {
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                event.preventDefault();
                onOpenConsultation(event.currentTarget);
              }}
            >
              <MessageSquareIcon size={18} /> Потрібна консультація?
              <ArrowRightIcon size={16} className="cinema-arrow cinema-arrow--diagonal" />
            </Link>
          </div>
          <div className="booking-intro__photo">
            <picture>
              <source media="(max-width: 767px)" srcSet={responsiveImages.bookingHeadlight.mobileSrcSet} />
              <source media="(max-width: 1199px)" srcSet={responsiveImages.bookingHeadlight.tabletSrcSet} />
              <img
                src={headlightPhoto}
                srcSet={responsiveImages.bookingHeadlight.srcSet}
                sizes="756px"
                alt=""
                width={1672}
                height={941}
                fetchPriority="high"
              />
            </picture>
          </div>
        </aside>

        <div ref={panel} className="booking-configurator">
          <div className="booking-configurator__frame" aria-hidden="true" />
          <header className="booking-configurator__header">
            <img src="/brand/mark.svg" alt="" width={70} height={46} />
            <p className="cinema-heading">Запис на дітейлінг</p>
          </header>
          <div className="booking-progress">
            <div className="booking-progress__track" aria-hidden="true">
              <span style={{ '--booking-completion': result ? 1 : step / (steps.length - 1) }} />
            </div>
            <ol aria-label="Кроки запису">
              {steps.map(({ label }, index) => (
                <li key={label} aria-current={!result && step === index ? 'step' : undefined} data-done={Boolean(result) || index < step}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <span>{label}</span>
                </li>
              ))}
            </ol>
          </div>

          {result ? (
            <div className="booking-result">
              <div className="booking-result__mark">
                <CheckIcon size={30} className="motion-check" />
              </div>
              <h2 id="booking-result" className="cinema-heading" tabIndex={-1}>{result.demo ? 'Демонстрацію завершено' : 'Заявку збережено'}</h2>
              <p>{result.demo ? 'Це імітація надсилання. Реальну заявку не створено, візит не підтверджено.' : 'Деталі візиту потрібно узгодити окремо за вказаним номером телефону.'}</p>
              {result.booking_id && <p className="booking-result__reference">Номер заявки: {result.booking_id}</p>}
              <BookingSummary draft={draft} {...summary} reduce={reduce} complete />
              <div className="booking-actions">
                <Link to="/" className="btn-outline cinema-button">На головну</Link>
                <button type="button" className="btn-platinum cinema-button" onClick={reset}>Нова заявка <ArrowRightIcon size={18} /></button>
              </div>
            </div>
          ) : (
            <form className="booking-form" noValidate onSubmit={handleSubmit} aria-describedby="booking-mode">
              <fieldset className="booking-form__controls" disabled={isSubmitting}>
                <div className="booking-form__stage" ref={stage}>
                  <AnimatePresence initial={false} mode="popLayout" custom={direction}>
                    <BookingStep key={step} step={step} direction={direction} reduce={reduce}>
                      {step === 0 && (
                        <>
                          <fieldset className="booking-options booking-options--services" aria-label="Окремі послуги" aria-describedby={errors.service ? 'booking-service-error' : undefined}>
                            {bookingServices.map(({ id, label }) => {
                              const { title, detail = label, icon: Icon } = serviceCards[id];
                              return <label className="booking-option booking-option--service" key={id}>
                                <input type="radio" name="service" value={id} checked={selectedService?.id === id} onChange={() => update('service', id)} />
                                <Icon size={24} />
                                <span><strong>{title}</strong><small>{detail}</small></span>
                                <span className="booking-option__check"><CheckIcon size={14} /></span>
                              </label>;
                            })}
                          </fieldset>
                          <div className="booking-service-package" data-selected={!selectedService && Boolean(draft.service)}>
                            <ZapIcon size={23} />
                            <div>
                              <label htmlFor="booking-package">Пакет або індивідуальний підбір</label>
                              <select id="booking-package" value={selectedService ? '' : draft.service} onChange={(event) => update('service', event.target.value)}>
                                <option value="" disabled>Оберіть варіант</option>
                                {extraServices.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
                              </select>
                            </div>
                          </div>
                          {errors.service && <p className="booking-field__error" id="booking-service-error">{errors.service}</p>}
                        </>
                      )}

                      {step === 1 && (
                        <>
                          <fieldset className="booking-options booking-options--classes" aria-label="Клас автомобіля">
                            {carClasses.map(({ id, label, example }) => (
                              <label className="booking-option booking-option--class" key={id}>
                                <input type="radio" name="carClass" value={id} checked={draft.carClass === id} onChange={() => update('carClass', id)} />
                                <CarIcon size={22} />
                                <span><strong>{label}</strong><small>{example}</small></span>
                                <span className="booking-option__check"><CheckIcon size={14} /></span>
                              </label>
                            ))}
                          </fieldset>
                          <button className="booking-text-button" type="button" aria-disabled={!draft.carClass} onClick={() => draft.carClass && update('carClass', '')}>Не вказувати клас</button>
                          {errors.carClass && <p className="booking-field__error">{errors.carClass}</p>}
                          <BookingField {...fieldProps('car')} label="Марка та модель" placeholder="Наприклад, Porsche 911" />
                        </>
                      )}

                      {step === 2 && (
                        <>
                          <BookingField {...fieldProps('date')} label="Бажана дата (необов’язково)" type="date" {...dateBounds} />
                          <fieldset className="booking-options booking-options--slots" aria-describedby={errors.timeSlot ? 'booking-slot-error' : undefined}>
                            <legend>Бажаний час</legend>
                            {timeSlots.map(({ id, label, time }) => {
                              const expired = isBookingSlotExpired(draft.date, id, scheduleNow);
                              return (
                                <label className="booking-option booking-option--slot" key={id}>
                                  <input type="radio" name="timeSlot" value={id} checked={!expired && draft.timeSlot === id} disabled={expired} onChange={() => update('timeSlot', id)} />
                                  <span><strong>{time}</strong><small>{expired ? 'Недоступний' : label}</small></span>
                                  <span className="booking-option__check"><CheckIcon size={14} /></span>
                                </label>
                              );
                            })}
                            {errors.timeSlot && <p className="booking-field__error" id="booking-slot-error" role="alert">{errors.timeSlot}</p>}
                          </fieldset>
                        </>
                      )}

                      {step === 3 && (
                        <>
                          <div className="booking-contact-fields">
                            <BookingField {...fieldProps('name')} label="Ваше ім’я *" placeholder="Як до вас звертатися?" autoComplete="name" required />
                            <BookingField {...fieldProps('phone')} label="Номер телефону *" type="tel" placeholder="+380 67 123 45 67" autoComplete="tel" required />
                          </div>
                          <BookingField {...fieldProps('comment')} label="Побажання (необов’язково)" placeholder="Додайте деталі щодо авто чи візиту" multiline />
                        </>
                      )}
                    </BookingStep>
                  </AnimatePresence>
                </div>
              </fieldset>

              <BookingSummary draft={draft} {...summary} reduce={reduce}
                slotExpired={step === 2 && isBookingSlotExpired(draft.date, draft.timeSlot, scheduleNow)} complete={step === 3} />
              {submitError && <p className="booking-submit-error" role="alert">{submitError}</p>}
              <div className="booking-actions">
                {step > 0 && (
                  <button type="button" className="btn-outline cinema-button booking-back" onClick={() => goTo(step - 1)} disabled={isSubmitting}>
                    <ArrowRightIcon size={18} /> Назад
                  </button>
                )}
                <button type="submit" className="btn-platinum cinema-button booking-next" aria-disabled={isSubmitting || (waiting && step === 3)}>
                  {isSubmitting ? 'Надсилаємо заявку…' : step < 3 ? 'Продовжити' : isDemo ? 'Надіслати демо-заявку' : 'Надіслати заявку'}
                  <ArrowRightIcon size={19} className="cinema-arrow" />
                </button>
              </div>
              <p className="booking-mode" id="booking-mode">
                <InfoIcon size={16} />
                {isDemo ? 'Демонстраційний режим. Реальна заявка не створюється.' : 'Збереження заявки не підтверджує візит.'}
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
