import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { createBooking } from '../api/bookingApi';
import { InfoIcon, AlertTriangleIcon, LockIcon, SparkleIcon, ArrowRightIcon } from '../components/Icons';
import './PagesCommon.css';
import './BookingPage.css';

const availableServices = [
  'Відновлювальне полірування',
  'Нанокераміка 9H Pro',
  'Преміум-хімчистка салона',
  'Обклеювання поліуретаном PPF',
  'Executive Care (Комплекс)',
  'Ceramic Elite (Комплекс)',
  'Royal Perfection (Комплекс)',
  'Індивідуальний підбір із технологом'
];

const timeSlots = [
  '10:00 — 12:00 (Ранок)',
  '12:00 — 15:00 (День)',
  '15:00 — 18:00 (День)',
  '18:00 — 21:00 (Вечір)',
  '21:00 — 00:00 (Нічна зміна)'
];

export default function BookingPage() {
  const location = useLocation();
  const preselectedService = location.state?.service;

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    car: '',
    service: preselectedService || availableServices[0],
    date: '',
    timeSlot: timeSlots[0],
    comment: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await createBooking(formData);
      setBookingResult(res);
      window.scrollTo({ top: 100, behavior: 'smooth' });
    } catch (err) {
      console.error('Помилка бронювання:', err);
      setErrorMsg('Не вдалося зберегти запис онлайн. Будь ласка, зателефонуйте нам за номером +380 (44) 000-00-00.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setBookingResult(null);
    setFormData({
      name: '',
      phone: '',
      car: '',
      service: availableServices[0],
      date: '',
      timeSlot: timeSlots[0],
      comment: ''
    });
  };

  return (
    <div className="booking-page">
      {/* Page Hero */}
      <section className="page-hero">
        <div className="container">
          <div className="page-hero__breadcrumbs">
            <Link to="/">Головна</Link>
            <span className="page-hero__sep">/</span>
            <span>Онлайн-запис</span>
          </div>
          <h1 className="page-hero__title">
            Онлайн-бронювання <span className="gold-text">бокса</span>
          </h1>
          <p className="page-hero__desc">
            Забронюйте індивідуальний чистий бокс із персональним майстром-технологом. Усі заявки миттєво реєструються в системі.
          </p>
        </div>
      </section>

      {/* Main Booking Area */}
      <section className="booking-section">
        <div className="container" style={{ maxWidth: '860px' }}>
          {bookingResult ? (
            <div className="booking-confirmation-card">
              <div className="confirmation-icon"><SparkleIcon size={28} /></div>
              <h2 className="confirmation-title">Запис успішно підтверджено!</h2>
              <p className="confirmation-desc">
                Щиро дякуємо, <strong>{formData.name}</strong>! Персональний консьєрж зв’яжеться з вами за номером{' '}
                <strong className="gold-text">{formData.phone}</strong> для підтвердження броні та оформлення гостьової перепустки на автомобіль.
              </p>

              <div className="confirmation-details">
                <div className="detail-row">
                  <span className="detail-label">Обрана послуга:</span>
                  <span className="detail-val">{formData.service}</span>
                </div>
                {formData.car && (
                  <div className="detail-row">
                    <span className="detail-label">Автомобіль:</span>
                    <span className="detail-val">{formData.car}</span>
                  </div>
                )}
                {formData.date && (
                  <div className="detail-row">
                    <span className="detail-label">Дата візиту:</span>
                    <span className="detail-val">{formData.date}</span>
                  </div>
                )}
                <div className="detail-row">
                  <span className="detail-label">Часовий слот:</span>
                  <span className="detail-val">{formData.timeSlot}</span>
                </div>
                {bookingResult.booking_id && (
                  <div className="detail-row">
                    <span className="detail-label">Номер заявки в базі:</span>
                    <span className="detail-val detail-val--id">{bookingResult.booking_id}</span>
                  </div>
                )}
              </div>

              <div className="confirmation-actions">
                <button type="button" onClick={resetForm} className="btn-outline">
                  Оформити ще один запис
                </button>
                <Link to="/" className="btn-gold">
                  Повернутися на головну
                </Link>
              </div>
            </div>
          ) : (
            <div className="booking-card">
              <div className="booking-card__header">
                <span className="booking-badge">ЕКСКЛЮЗИВНИЙ СЕРВІС • ДЕМО-ВІТРИНА</span>
                <h2 className="booking-card__title">Заповніть дані для візиту</h2>
                <p className="booking-card__desc">
                  Вкажіть бажану програму догляду та зручний час. Ми зв’яжемося з вами протягом 10 хвилин.
                </p>
              </div>

              {/* Demo Mode Notice Banner */}
              <div style={{
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 16px',
                fontSize: '0.85rem',
                color: 'var(--color-text-secondary)',
                marginBottom: '24px',
                lineHeight: '1.5'
              }}>
                <span style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ flexShrink: 0, marginTop: '1px' }}><InfoIcon size={16} /></span>
                  <span><strong>Демонстраційний режим:</strong> цей сайт є вітринним портфоліо-проєктом. Форма демонструє повноцінне підключення до бази даних Supabase PostgreSQL.</span>
                </span>
              </div>

              {errorMsg && (
                <div className="booking-error-banner">
                  <span style={{ flexShrink: 0 }}><AlertTriangleIcon size={16} /></span> {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="booking-form">
                {/* 1. Service Selection */}
                <div className="booking-form-block">
                  <label className="booking-label">1. Оберіть послугу або пакет *</label>
                  <select
                    className="booking-select"
                    value={formData.service}
                    onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                  >
                    {availableServices.map((srv, idx) => (
                      <option key={idx} value={srv}>{srv}</option>
                    ))}
                    {!availableServices.includes(formData.service) && (
                      <option value={formData.service}>{formData.service}</option>
                    )}
                  </select>
                </div>

                {/* 2. Client & Vehicle details */}
                <div className="booking-grid-2">
                  <div className="booking-form-block">
                    <label htmlFor="b-name" className="booking-label">Ваше ім’я *</label>
                    <input
                      id="b-name"
                      type="text"
                      required
                      placeholder="Костянтин"
                      className="booking-input"
                      value={formData.name}
                      disabled={isSubmitting}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="booking-form-block">
                    <label htmlFor="b-phone" className="booking-label">Номер телефону *</label>
                    <input
                      id="b-phone"
                      type="tel"
                      required
                      placeholder="+380 (__) ___-__-__"
                      className="booking-input"
                      value={formData.phone}
                      disabled={isSubmitting}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="booking-grid-2">
                  <div className="booking-form-block">
                    <label htmlFor="b-car" className="booking-label">Марка та модель авто</label>
                    <input
                      id="b-car"
                      type="text"
                      placeholder="Наприклад: Porsche 911 Turbo S"
                      className="booking-input"
                      value={formData.car}
                      disabled={isSubmitting}
                      onChange={(e) => setFormData({ ...formData, car: e.target.value })}
                    />
                  </div>

                  <div className="booking-form-block">
                    <label htmlFor="b-date" className="booking-label">Бажана дата візиту</label>
                    <input
                      id="b-date"
                      type="date"
                      className="booking-input"
                      value={formData.date}
                      disabled={isSubmitting}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                </div>

                {/* 3. Slot Selector */}
                <div className="booking-form-block">
                  <label className="booking-label">Зручний час прийому</label>
                  <div className="slot-pills">
                    {timeSlots.map((slot, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={`slot-pill ${formData.timeSlot === slot ? 'slot-pill--active' : ''}`}
                        onClick={() => setFormData({ ...formData, timeSlot: slot })}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Comments */}
                <div className="booking-form-block">
                  <label htmlFor="b-comment" className="booking-label">Особливі побажання (необов’язково)</label>
                  <textarea
                    id="b-comment"
                    rows="3"
                    placeholder="Наприклад: необхідна перепустка на кілька днів або делікатне зняття старої плівки"
                    className="booking-textarea"
                    value={formData.comment}
                    disabled={isSubmitting}
                    onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="btn-gold booking-submit-btn"
                  disabled={isSubmitting}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <span>{isSubmitting ? 'Реєстрація бронювання...' : 'Забронювати бокс онлайн'}</span>
                  {!isSubmitting && <ArrowRightIcon size={16} />}
                </button>

                <p className="booking-privacy" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <LockIcon size={14} /> Демонстраційний захист даних. Контакти не передаються третім особам.
                </p>
              </form>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
