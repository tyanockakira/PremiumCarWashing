import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { createBooking } from '../api/bookingApi';
import './PagesCommon.css';
import './BookingPage.css';

const availableServices = [
  'Восстановительная полировка',
  'Нанокерамика 9H Pro',
  'Премиум-химчистка салона',
  'Оклейка полиуретаном PPF',
  'Executive Care (Комплекс)',
  'Ceramic Elite (Комплекс)',
  'Royal Perfection (Комплекс)',
  'Индивидуальный подбор с технологом'
];

const timeSlots = [
  '10:00 — 12:00 (Утро)',
  '12:00 — 15:00 (День)',
  '15:00 — 18:00 (День)',
  '18:00 — 21:00 (Вечер)',
  '21:00 — 00:00 (Ночная смена)'
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
      console.error('Ошибка бронирования:', err);
      setErrorMsg('Не удалось сохранить запись онлайн. Пожалуйста, позвоните нам по номеру +7 (495) 999-00-88.');
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
            <Link to="/">Главная</Link>
            <span className="page-hero__sep">/</span>
            <span>Онлайн-запись</span>
          </div>
          <h1 className="page-hero__title">
            Онлайн-бронирование <span className="gold-text">бокса</span>
          </h1>
          <p className="page-hero__desc">
            Забронируйте индивидуальный чистый бокс с персональным мастером-технологом. Все заявки мгновенно регистрируются в системе.
          </p>
        </div>
      </section>

      {/* Main Booking Area */}
      <section className="booking-section">
        <div className="container" style={{ maxWidth: '860px' }}>
          {bookingResult ? (
            <div className="booking-confirmation-card">
              <div className="confirmation-icon">✦</div>
              <h2 className="confirmation-title">Запись успешно подтверждена!</h2>
              <p className="confirmation-desc">
                Благодарим вас, <strong>{formData.name}</strong>! Персональный консьерж свяжется с вами по номеру{' '}
                <strong className="gold-text">{formData.phone}</strong> для подтверждения брони и оформления гостевого пропуска на автомобиль.
              </p>

              <div className="confirmation-details">
                <div className="detail-row">
                  <span className="detail-label">Выбранная услуга:</span>
                  <span className="detail-val">{formData.service}</span>
                </div>
                {formData.car && (
                  <div className="detail-row">
                    <span className="detail-label">Автомобиль:</span>
                    <span className="detail-val">{formData.car}</span>
                  </div>
                )}
                {formData.date && (
                  <div className="detail-row">
                    <span className="detail-label">Дата визита:</span>
                    <span className="detail-val">{formData.date}</span>
                  </div>
                )}
                <div className="detail-row">
                  <span className="detail-label">Временной слот:</span>
                  <span className="detail-val">{formData.timeSlot}</span>
                </div>
                {bookingResult.booking_id && (
                  <div className="detail-row">
                    <span className="detail-label">Номер заявки в базе:</span>
                    <span className="detail-val detail-val--id">{bookingResult.booking_id}</span>
                  </div>
                )}
              </div>

              <div className="confirmation-actions">
                <button type="button" onClick={resetForm} className="btn-outline">
                  Оформить еще одну запись
                </button>
                <Link to="/" className="btn-gold">
                  Вернуться на главную
                </Link>
              </div>
            </div>
          ) : (
            <div className="booking-card">
              <div className="booking-card__header">
                <span className="booking-badge">ЭКСКЛЮЗИВНЫЙ СЕРВИС</span>
                <h2 className="booking-card__title">Заполните данные для визита</h2>
                <p className="booking-card__desc">
                  Укажите желаемую программу ухода и удобное время. Мы свяжемся с вами в течение 10 минут.
                </p>
              </div>

              {errorMsg && (
                <div className="booking-error-banner">
                  ⚠️ {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="booking-form">
                {/* 1. Service Selection */}
                <div className="booking-form-block">
                  <label className="booking-label">1. Выберите услугу или пакет *</label>
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
                    <label htmlFor="b-name" className="booking-label">Ваше имя *</label>
                    <input
                      id="b-name"
                      type="text"
                      required
                      placeholder="Константин"
                      className="booking-input"
                      value={formData.name}
                      disabled={isSubmitting}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="booking-form-block">
                    <label htmlFor="b-phone" className="booking-label">Номер телефона *</label>
                    <input
                      id="b-phone"
                      type="tel"
                      required
                      placeholder="+7 (___) ___-__-__"
                      className="booking-input"
                      value={formData.phone}
                      disabled={isSubmitting}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="booking-grid-2">
                  <div className="booking-form-block">
                    <label htmlFor="b-car" className="booking-label">Марка и модель авто</label>
                    <input
                      id="b-car"
                      type="text"
                      placeholder="Например: Porsche 911 Turbo S"
                      className="booking-input"
                      value={formData.car}
                      disabled={isSubmitting}
                      onChange={(e) => setFormData({ ...formData, car: e.target.value })}
                    />
                  </div>

                  <div className="booking-form-block">
                    <label htmlFor="b-date" className="booking-label">Желаемая дата визита</label>
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
                  <label className="booking-label">Удобное время приёмки</label>
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
                  <label htmlFor="b-comment" className="booking-label">Особые пожелания (необязательно)</label>
                  <textarea
                    id="b-comment"
                    rows="3"
                    placeholder="Например: необходим пропуск на несколько дней или бережное снятие старой пленки"
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
                >
                  {isSubmitting ? 'Регистрация бронирования...' : 'Забронировать бокс онлайн →'}
                </button>

                <p className="booking-privacy">
                  🔒 Ваши данные защищены шифрованием. Мы не передаем контакты третьим лицам.
                </p>
              </form>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
