import { useState, useEffect } from 'react';
import { bookingMode } from '../lib/supabase';
import { bookingPackages, bookingServices, getBookingPreselection, individualBooking } from '../data/bookingOptions';
import { getBookingDateBounds, isBookingSlotExpired } from '../lib/bookingValidation';
import { useBookingClock } from '../lib/useBookingClock';
import { useBookingSubmission } from '../lib/useBookingSubmission';
import { InfoIcon, AlertTriangleIcon, CloseIcon, SparkleIcon } from './Icons';
import './BookingModal.css';

const services = [...bookingServices, ...bookingPackages, individualBooking];
const timeSlots = [
  ['10:00-12:00', 'Ранок (10:00 — 12:00)'],
  ['12:00-15:00', 'День (12:00 — 15:00)'],
  ['15:00-19:00', 'Вечір (15:00 — 19:00)'],
  ['19:00-23:00', 'Пізній вечір (19:00 — 23:00)'],
  ['night_by_arrangement', 'Нічна зміна (за домовленістю)'],
];

function emptyDraft(service = services[0].id) {
  return {
    name: '',
    phone: '',
    car: '',
    service,
    date: '',
    timeSlot: '10:00-12:00',
    comment: ''
  };
}

export default function BookingModal({ isOpen, onClose, initialService }) {
  const [formData, setFormData] = useState(() => emptyDraft(getBookingPreselection({ service: initialService })?.id));
  const [submitted, setSubmitted] = useState(false);
  const { submit, sending: isSubmitting, error: errorMsg, waiting } = useBookingSubmission();
  const [bookingResult, setBookingResult] = useState(null);
  const isDemoMode = bookingMode === 'demo';
  const scheduleNow = useBookingClock(isOpen && !submitted);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || waiting) return;
    const field = e.currentTarget.querySelector('input:required:invalid, input[type=date]:invalid');
    if (field?.required || field?.validity.badInput) {
      field.reportValidity();
      return;
    }
    const result = await submit('booking', {
      ...formData,
      selection: services.find(({ id }) => id === formData.service)?.selection,
      slotId: formData.timeSlot,
    });
    if (result) {
      setBookingResult(result);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
        setFormData(emptyDraft());
        setBookingResult(null);
      }, 3500);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Закрити"
        >
          <CloseIcon size={18} />
        </button>

        {submitted ? (
          <div className="modal-success">
            <div className="modal-success__icon"><SparkleIcon size={28} /></div>
            <h3 className="modal-success__title">
              {bookingResult?.demo ? 'Демонстраційна заявка сформована' : 'Заявку збережено'}
            </h3>
            <p className="modal-success__text">
              {bookingResult?.demo
                ? 'Це лише імітація надсилання. Реальний запис не створено.'
                : <>Дякуємо, <strong>{formData.name}</strong>! Заявку збережено. Деталі візиту потрібно узгодити окремо за номером{' '}
                  <strong>{formData.phone}</strong>.</>}
            </p>
            <div className="modal-success__bar"></div>
          </div>
        ) : (
          <>
            <div className="modal-header">
              <span className="modal-tag">
                {isDemoMode ? 'ОНЛАЙН-БРОНЮВАННЯ • ДЕМО' : 'ОНЛАЙН-БРОНЮВАННЯ'}
              </span>
              <h3 className="modal-title">Запис на дітейлінг</h3>
              <p className="modal-subtitle">
                Залиште заявку, щоб узгодити індивідуальний чистий бокс для вашого авто.
              </p>
            </div>

            <div style={{
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              fontSize: '0.8rem',
              color: 'var(--color-text-secondary)',
              marginBottom: '18px'
            }}>
              <span style={{ display: 'flex', alignItems: 'flex-start', gap: '7px' }}>
                <span style={{ flexShrink: 0, marginTop: '1px' }}><InfoIcon size={15} /></span>
                <span>
                  {isDemoMode
                    ? <><strong>Демо-режим:</strong> форма імітує надсилання. Реальний запис не створюється.</>
                    : <><strong>Робочий режим:</strong> заявка буде збережена лише після успішного підтвердження сервером.</>}
                </span>
              </span>
            </div>

            {errorMsg && (
              <div className="modal-error-banner" role="alert">
                <span style={{ flexShrink: 0 }}><AlertTriangleIcon size={16} /></span> {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="modal-form" noValidate>
              <div className="form-row">
                <div className="modal-field">
                  <label htmlFor="modal-name">Ваше ім’я *</label>
                  <input
                    id="modal-name"
                    type="text"
                    required
                    placeholder="Костянтин"
                    value={formData.name}
                    disabled={isSubmitting}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="modal-field">
                  <label htmlFor="modal-phone">Телефон *</label>
                  <input
                    id="modal-phone"
                    type="tel"
                    required
                    placeholder="+380 (__) ___-__-__"
                    value={formData.phone}
                    disabled={isSubmitting}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="modal-field">
                  <label htmlFor="modal-car">Автомобіль (Марка / Модель)</label>
                  <input
                    id="modal-car"
                    type="text"
                    placeholder="Наприклад: Porsche 911 GT3"
                    value={formData.car}
                    disabled={isSubmitting}
                    onChange={(e) => setFormData({ ...formData, car: e.target.value })}
                  />
                </div>

                <div className="modal-field">
                  <label htmlFor="modal-service">Бажана послуга</label>
                  <select
                    id="modal-service"
                    value={formData.service}
                    disabled={isSubmitting}
                    onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                  >
                    {services.map(({ id, label }) => (
                      <option key={id} value={id}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="modal-field">
                  <label htmlFor="modal-date">Бажана дата</label>
                  <input
                    id="modal-date"
                    type="date"
                    {...getBookingDateBounds(scheduleNow)}
                    value={formData.date}
                    disabled={isSubmitting}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>

                <div className="modal-field">
                  <label htmlFor="modal-slot">Зручний час прийому</label>
                  <select
                    id="modal-slot"
                    value={formData.timeSlot}
                    disabled={isSubmitting}
                    onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                  >
                    {timeSlots.map(([id, label]) => {
                      const expired = isBookingSlotExpired(formData.date, id, scheduleNow);
                      return <option key={id} value={id} disabled={expired}>{label}{expired ? ' — недоступний' : ''}</option>;
                    })}
                  </select>
                </div>
              </div>

              <div className="modal-field">
                <label htmlFor="modal-comment">Особливі побажання (необов’язково)</label>
                <textarea
                  id="modal-comment"
                  rows="2"
                  placeholder="Наприклад: потрібен попередній огляд ЛФП або трансфер"
                  value={formData.comment}
                  disabled={isSubmitting}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                ></textarea>
              </div>

              <button
                type="submit"
                className="btn-gold modal-submit-btn"
                disabled={isSubmitting || waiting}
              >
                {isSubmitting ? 'Бронювання...' : 'Забронювати бокс'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
