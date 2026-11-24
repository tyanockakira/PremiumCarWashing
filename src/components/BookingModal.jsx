import { useState, useEffect } from 'react';
import { createBooking } from '../api/bookingApi';
import { bookingMode } from '../lib/supabase';
import { InfoIcon, AlertTriangleIcon, CloseIcon, SparkleIcon } from './Icons';
import './BookingModal.css';

const defaultServices = [
  'Відновлювальне полірування',
  'Нанокераміка 9H Pro',
  'Преміум-хімчистка салона',
  'Обклеювання поліуретаном PPF',
  'Executive Care (Комплекс)',
  'Ceramic Elite (Комплекс)',
  'Royal Perfection (Комплекс)'
];

export default function BookingModal({ isOpen, onClose, initialService }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    car: '',
    service: initialService || defaultServices[0],
    date: '',
    timeSlot: '10:00 — 12:00',
    comment: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [bookingResult, setBookingResult] = useState(null);
  const isDemoMode = bookingMode === 'demo';

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
    if (!formData.name || !formData.phone) return;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const result = await createBooking(formData);
      setBookingResult(result);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
        setFormData({
          name: '',
          phone: '',
          car: '',
          service: defaultServices[0],
          date: '',
          timeSlot: '10:00 — 12:00',
          comment: ''
        });
        setBookingResult(null);
      }, 3500);
    } catch (err) {
      console.error('Помилка запису:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Не вдалося зберегти запис онлайн. Будь ласка, зателефонуйте нам за номером +380 (44) 000-00-00.');
    } finally {
      setIsSubmitting(false);
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
              <div className="modal-error-banner">
                <span style={{ flexShrink: 0 }}><AlertTriangleIcon size={16} /></span> {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="modal-form">
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
                    {defaultServices.map((srv, idx) => (
                      <option key={idx} value={srv}>
                        {srv}
                      </option>
                    ))}
                    {!defaultServices.includes(formData.service) && formData.service && (
                      <option value={formData.service}>{formData.service}</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="modal-field">
                  <label htmlFor="modal-date">Бажана дата</label>
                  <input
                    id="modal-date"
                    type="date"
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
                    <option value="10:00 — 12:00">Ранок (10:00 — 12:00)</option>
                    <option value="12:00 — 15:00">День (12:00 — 15:00)</option>
                    <option value="15:00 — 19:00">Вечір (15:00 — 19:00)</option>
                    <option value="19:00 — 23:00">Пізній вечір (19:00 — 23:00)</option>
                    <option value="Ніч 24/7">Нічна зміна (за домовленістю)</option>
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
                disabled={isSubmitting}
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
