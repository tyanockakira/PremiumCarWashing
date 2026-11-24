import { forwardRef, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useIsPresent } from 'motion/react';
import { createBooking } from '../api/bookingApi';
import { bookingMode } from '../lib/supabase';
import { defaultCarClasses } from '../data/carClasses';
import {
  ArrowRightIcon, CarIcon, CheckIcon, InfoIcon, LogoEmblem,
  MessageSquareIcon, ShieldCheckIcon, ShieldIcon, ZapIcon,
} from '../components/Icons';
import { useDetailReducedMotion } from '../components/useDetailReducedMotion';
import { duration, easeGlide } from '../lib/motion';
import { getBookingDateError, latestBookingDate, normalizeUkrainianPhone } from '../lib/bookingValidation';
import headlightPhoto from '../assets/premiumwash/booking-headlight.webp';
import './BookingPage.css';

const services = [
  { value: 'Відновлювальне полірування', title: 'Полірування кузова', detail: 'Відновлювальне полірування', icon: LogoEmblem },
  { value: 'Нанокераміка 9H Pro', title: 'Захисне покриття', detail: 'Нанокераміка 9H Pro', icon: ShieldCheckIcon },
  { value: 'Преміум-хімчистка салона', title: 'Догляд за салоном', detail: 'Преміум-хімчистка салону', icon: CarIcon },
  { value: 'Обклеювання поліуретаном PPF', title: 'Обклеювання PPF', detail: 'Поліуретанова плівка', icon: ShieldIcon },
];

const packages = ['Executive Care (Комплекс)', 'Ceramic Elite (Комплекс)', 'Royal Perfection (Комплекс)'];
const individual = 'Індивідуальний підбір із технологом';
const timeSlots = [
  ['10:00 — 12:00', 'Ранок'],
  ['12:00 — 15:00', 'День'],
  ['15:00 — 18:00', 'День'],
  ['18:00 — 21:00', 'Вечір'],
  ['21:00 — 00:00', 'Нічна зміна'],
].map(([time, label]) => ({ time, label, value: time + ' (' + label + ')' }));

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

function currentDate() {
  return new Intl.DateTimeFormat('sv-SE').format(new Date());
}

function pricingClassFor(service) {
  return defaultCarClasses.find(({ label }) => service.endsWith(' (' + label + ')'))?.label || '';
}

function makeDraft(preselection) {
  return {
    service: preselection || services[0].value,
    carClass: pricingClassFor(preselection),
    car: '',
    date: '',
    timeSlot: timeSlots[0].value,
    name: '',
    phone: '',
    comment: '',
  };
}

function serviceLabel(service) {
  const pricingClass = pricingClassFor(service);
  if (pricingClass) return service.slice(0, -(pricingClass.length + 3));
  return findService(service)?.detail || service;
}

function findService(service) {
  return services.find(({ value, detail }) => value === service || detail === service);
}

function BookingSummary({ draft, reduce, complete = false }) {
  const date = draft.date ? draft.date.split('-').reverse().join('.') : 'Дата не вказана';
  const slot = timeSlots.find(({ value }) => value === draft.timeSlot);
  const summary = [
    ['Послуга', serviceLabel(draft.service)],
    ['Автомобіль', [draft.car.trim(), draft.carClass].filter(Boolean).join(' · ') || 'Не вказано'],
    ['Дата і час', [date, slot?.time].filter(Boolean).join(' · ')],
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
  const preselection = typeof state?.service === 'string' ? state.service.trim() : '';
  const [draft, setDraft] = useState(() => makeDraft(preselection));
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const pending = useRef(false);
  const focusStep = useRef(false);
  const panel = useRef(null);
  const stage = useRef(null);
  const reduce = useDetailReducedMotion();
  const isDemo = bookingMode === 'demo';
  const today = currentDate();
  const selectedService = findService(draft.service);
  const extraServices = [...packages, individual];
  if (preselection && !findService(preselection) && !extraServices.includes(preselection)) {
    extraServices.unshift(preselection);
  }

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
    setErrors((current) => ({ ...current, [name]: '' }));
    setSubmitError('');
  }

  function goTo(nextStep) {
    focusStep.current = true;
    setDirection(nextStep < step ? -1 : 1);
    setErrors({});
    setSubmitError('');
    setStep(nextStep);
  }

  function validate(phone) {
    if (step === 0 && !draft.service) return { service: 'Оберіть послугу або пакет.' };
    if (step === 1 && draft.carClass && !defaultCarClasses.some(({ label }) => label === draft.carClass)) {
      return { carClass: 'Оберіть клас зі списку.' };
    }
    if (step === 2) {
      const field = stage.current.querySelector('.booking-step:not([inert]) #booking-date');
      if (field?.validity.badInput) {
        return { date: 'Вкажіть дійсну календарну дату або залиште поле порожнім.' };
      }
      const dateError = getBookingDateError(draft.date, currentDate());
      if (dateError) return { date: dateError };
      if (!timeSlots.some(({ value }) => value === draft.timeSlot)) return { timeSlot: 'Оберіть бажаний час.' };
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
    if (pending.current) return;

    const phone = step === steps.length - 1 ? normalizeUkrainianPhone(draft.phone) : '';
    const invalid = validate(phone);
    const firstInvalid = Object.keys(invalid)[0];
    if (firstInvalid) {
      setErrors(invalid);
      stage.current?.querySelector('.booking-step:not([inert]) [name="' + firstInvalid + '"]')?.focus();
      return;
    }
    if (step < steps.length - 1) {
      goTo(step + 1);
      return;
    }
    const dateError = getBookingDateError(draft.date, currentDate());
    if (dateError) {
      goTo(2);
      setErrors({ date: dateError });
      return;
    }

    pending.current = true;
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const pricingClass = pricingClassFor(draft.service);
      const service = pricingClass && pricingClass !== draft.carClass
        ? [serviceLabel(draft.service), draft.carClass && '(' + draft.carClass + ')'].filter(Boolean).join(' ')
        : draft.service;
      const response = await createBooking({
        name: draft.name.trim(),
        phone,
        car: draft.car.trim(),
        service,
        date: draft.date,
        timeSlot: draft.timeSlot,
        comment: [draft.carClass && 'Клас автомобіля: ' + draft.carClass, draft.comment.trim()].filter(Boolean).join('\n'),
      });
      focusStep.current = true;
      setResult(response);
    } catch {
      setSubmitError('Не вдалося зберегти заявку. Спробуйте ще раз.');
    } finally {
      pending.current = false;
      setIsSubmitting(false);
    }
  }

  function reset() {
    setDraft(makeDraft(''));
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
            <img src={headlightPhoto} alt="" width={1672} height={941} fetchPriority="high" />
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
              <BookingSummary draft={draft} reduce={reduce} complete />
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
                            {services.map(({ value, title, detail, icon: Icon }) => (
                              <label className="booking-option booking-option--service" key={value}>
                                <input type="radio" name="service" value={value} checked={selectedService?.value === value} onChange={() => update('service', value)} />
                                <Icon size={24} />
                                <span><strong>{title}</strong><small>{detail}</small></span>
                                <span className="booking-option__check"><CheckIcon size={14} /></span>
                              </label>
                            ))}
                          </fieldset>
                          <div className="booking-service-package" data-selected={!selectedService && Boolean(draft.service)}>
                            <ZapIcon size={23} />
                            <div>
                              <label htmlFor="booking-package">Пакет або індивідуальний підбір</label>
                              <select id="booking-package" value={selectedService ? '' : draft.service} onChange={(event) => update('service', event.target.value)}>
                                <option value="" disabled>Оберіть варіант</option>
                                {extraServices.map((value) => <option key={value} value={value}>{value}</option>)}
                              </select>
                            </div>
                          </div>
                          {errors.service && <p className="booking-field__error" id="booking-service-error">{errors.service}</p>}
                        </>
                      )}

                      {step === 1 && (
                        <>
                          <fieldset className="booking-options booking-options--classes" aria-label="Клас автомобіля">
                            {defaultCarClasses.map(({ id, label, example }) => (
                              <label className="booking-option booking-option--class" key={id}>
                                <input type="radio" name="carClass" value={label} checked={draft.carClass === label} onChange={() => update('carClass', label)} />
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
                          <BookingField {...fieldProps('date')} label="Бажана дата (необов’язково)" type="date" min={today} max={latestBookingDate} />
                          <fieldset className="booking-options booking-options--slots">
                            <legend>Бажаний час</legend>
                            {timeSlots.map(({ value, label, time }) => (
                              <label className="booking-option booking-option--slot" key={value}>
                                <input type="radio" name="timeSlot" value={value} checked={draft.timeSlot === value} onChange={() => update('timeSlot', value)} />
                                <span><strong>{time}</strong><small>{label}</small></span>
                                <span className="booking-option__check"><CheckIcon size={14} /></span>
                              </label>
                            ))}
                            {errors.timeSlot && <p className="booking-field__error">{errors.timeSlot}</p>}
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

              <BookingSummary draft={draft} reduce={reduce} complete={step === 3} />
              {submitError && <p className="booking-submit-error" role="alert">{submitError}</p>}
              <div className="booking-actions">
                {step > 0 && (
                  <button type="button" className="btn-outline cinema-button booking-back" onClick={() => goTo(step - 1)} disabled={isSubmitting}>
                    <ArrowRightIcon size={18} /> Назад
                  </button>
                )}
                <button type="submit" className="btn-platinum cinema-button booking-next" aria-disabled={isSubmitting}>
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
