import { useRef, useState } from 'react';
import { createConsultation } from '../api/bookingApi';
import { bookingMode } from '../lib/supabase';
import { ArrowRightIcon, CarIcon, CheckIcon, MessageSquareIcon, ShieldIcon } from './Icons';
import './Contacts.css';

const emptyForm = { name: '', phone: '', carModel: '', question: '' };
const topics = [
  { value: 'Дітейлінг', icon: CarIcon },
  { value: 'Захист кузова', icon: ShieldIcon },
  { value: 'Догляд за салоном', icon: SeatIcon },
  { value: 'Інше', icon: MessageSquareIcon },
];
const contactFields = [
  { name: 'name', label: 'Ваше ім’я', placeholder: 'Як до вас звертатися?', type: 'text', autoComplete: 'given-name', error: 'Вкажіть ваше ім’я.' },
  { name: 'phone', label: 'Номер телефону', placeholder: '+380 00 000 00 00', type: 'tel', autoComplete: 'tel', error: 'Вкажіть номер телефону.' },
  { name: 'carModel', label: 'Марка та модель авто', placeholder: 'Наприклад, Audi A6', type: 'text' },
  { name: 'question', label: 'Ваше запитання', placeholder: 'Коротко опишіть стан авто або потрібну послугу' },
];

function SeatIcon({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5.5 3 2.1 8.2a2 2 0 0 0 1.9 1.6H16a1.5 1.5 0 0 1 0 3H8a3.4 3.4 0 0 1-3.2-2.4L2.5 4a1.5 1.5 0 1 1 3-1ZM8 15.8V18m7-2.2V18" />
    </svg>
  );
}

export default function Contacts() {
  const [formData, setFormData] = useState(emptyForm);
  const [invalidFields, setInvalidFields] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [consultationResult, setConsultationResult] = useState(null);
  const [topic, setTopic] = useState('');
  const pending = useRef(false);
  const isDemoMode = bookingMode === 'demo';
  const selectedIndex = topics.findIndex(({ value }) => value === topic);

  async function handleSubmit(event) {
    event.preventDefault();
    if (pending.current) return;

    const request = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      carModel: formData.carModel.trim(),
      question: [topic && 'Тема консультації: ' + topic, formData.question.trim()].filter(Boolean).join('\n'),
    };

    if (!request.name || !request.phone) {
      setInvalidFields({ name: !request.name, phone: !request.phone });
      event.currentTarget.elements.namedItem(request.name ? 'phone' : 'name').focus();
      return;
    }

    pending.current = true;
    setIsSubmitting(true);
    setErrorMsg('');
    setConsultationResult(null);
    try {
      const result = await createConsultation(request);
      setConsultationResult(result);
      setFormData(emptyForm);
      setTopic('');
    } catch {
      setErrorMsg('Не вдалося надіслати запит. Спробуйте ще раз.');
    } finally {
      pending.current = false;
      setIsSubmitting(false);
    }
  }

  function updateField(event) {
    const { name, value } = event.currentTarget;
    setFormData((current) => ({ ...current, [name]: value }));
    setInvalidFields((current) => ({ ...current, [name]: current[name] && !value.trim() }));
    setConsultationResult(null);
  }

  function selectTopic(event) {
    setTopic(event.currentTarget.value);
    setConsultationResult(null);
  }

  return (
    <>
      <header className="contacts-panel__header contacts-enter">
        <h2 id="consultation-title" className="cinema-heading contacts-panel__title">Запит на консультацію</h2>
        <p>Залиште контакти й опишіть, що вас цікавить.</p>
      </header>
      <form className="consultation-form" onSubmit={handleSubmit} noValidate aria-describedby="consultation-mode">
        <fieldset className="consultation-topics contacts-enter" disabled={isSubmitting}>
          <legend>Тема консультації <span>необов’язково</span></legend>
          <div className="consultation-topics__grid">
            {topics.map(({ value, icon: TopicIcon }) => (
              <label key={value} className="consultation-topic">
                <input type="radio" name="consultation-topic" value={value} checked={topic === value} onChange={selectTopic} />
                <TopicIcon size={18} />
                <span>{value}</span>
              </label>
            ))}
            <span
              className="consultation-topics__indicator"
              data-visible={selectedIndex >= 0}
              style={{
                '--topic-index': Math.max(selectedIndex, 0),
                '--topic-column': Math.max(selectedIndex, 0) % 2,
                '--topic-row': selectedIndex >= 2 ? 1 : 0,
              }}
              aria-hidden="true"
            />
          </div>
        </fieldset>

        <div className="consultation-fields contacts-enter">
          {contactFields.map(({ name, label, placeholder, type, autoComplete, error }) => {
            const id = 'contact-' + name;
            const invalid = Boolean(invalidFields[name]);
            const filled = Boolean(formData[name].trim()) && !invalid;
            const controlProps = { id, name, placeholder, value: formData[name], disabled: isSubmitting, onChange: updateField };
            return (
              <div key={name} className="consultation-field" data-wide={!error}>
                <label htmlFor={id}>{label}{error && <span aria-hidden="true"> *</span>}</label>
                <div className="consultation-control" data-filled={filled}>
                  {type ? (
                    <input
                      {...controlProps}
                      type={type}
                      autoComplete={autoComplete}
                      required={Boolean(error)}
                      aria-invalid={invalid || undefined}
                      aria-describedby={invalid ? id + '-error' : undefined}
                    />
                  ) : <textarea {...controlProps} rows={3} />}
                  <CheckIcon size={18} className="consultation-control__check" />
                </div>
                {invalid && <p id={id + '-error'} className="consultation-field__error">{error}</p>}
              </div>
            );
          })}
        </div>

        <div className="consultation-form__actions contacts-enter">
          <button type="submit" className="btn-platinum cinema-button consultation-form__submit" aria-disabled={isSubmitting}>
            {isSubmitting ? 'Надсилаємо запит…' : isDemoMode ? 'Спробувати надсилання' : 'Надіслати запит'}
            <ArrowRightIcon size={18} className="cinema-arrow cinema-arrow--diagonal" />
          </button>
          <p id="consultation-mode">
            {isDemoMode ? 'Демонстраційний режим. Реальний запит не створюється.' : 'Ім’я та номер телефону передаються разом із запитом.'}
          </p>
          {errorMsg && <p className="consultation-form__feedback consultation-form__feedback--error" role="alert">{errorMsg}</p>}
          <div className="consultation-form__status" role="status">
            {consultationResult && (
              <p className="consultation-form__feedback">
                <CheckIcon size={18} />
                {consultationResult.demo ? 'Імітацію надсилання завершено. Реальний запит не створено.' : 'Запит збережено. Деталі консультації потрібно узгодити окремо.'}
              </p>
            )}
          </div>
        </div>
      </form>
    </>
  );
}
