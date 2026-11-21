import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createConsultation } from '../api/bookingApi';
import './Contacts.css';

export default function Contacts({ onOpenBooking, hideHeader = false }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    carModel: '',
    question: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await createConsultation(formData);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setFormData({ name: '', phone: '', carModel: '', question: '' });
      }, 4000);
    } catch (err) {
      console.error('Ошибка отправки формы:', err);
      setErrorMsg('Не удалось отправить заявку. Пожалуйста, позвоните нам по номеру +7 (495) 999-00-88.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBookingClick = () => {
    if (onOpenBooking) {
      onOpenBooking();
    } else {
      navigate('/booking');
    }
  };

  return (
    <section id="contacts" className="contacts-section">
      <div className="container">
        {!hideHeader && (
          <div className="section-header">
            <div className="gold-sub-title">КАК НАС НАЙТИ</div>
            <h2 className="section-title">
              Контакты и <span className="gold-text">локация студии</span>
            </h2>
            <p className="section-desc">
              Ждем вас в удобной локации с собственной охраняемой территорией,
              лаундж-зоной с зерновым кофе и сигарной комнатой.
            </p>
          </div>
        )}

        <div className="contacts-grid">
          {/* Info Card */}
          <div className="contacts-info">
            <div className="contact-item">
              <div className="contact-item__icon">📍</div>
              <div className="contact-item__content">
                <span className="contact-item__label">Адрес студии</span>
                <p className="contact-item__value">г. Москва, Кутузовский проспект, 36с1</p>
                <span className="contact-item__hint">Закрытый охраняемый въезд, въезд по пропускам</span>
              </div>
            </div>

            <div className="contact-item">
              <div className="contact-item__icon">⏱️</div>
              <div className="contact-item__content">
                <span className="contact-item__label">График работы</span>
                <p className="contact-item__value">Круглосуточно — 24/7</p>
                <span className="contact-item__hint">Приёмка и выдача автомобилей в любое время по записи</span>
              </div>
            </div>

            <div className="contact-item">
              <div className="contact-item__icon">📞</div>
              <div className="contact-item__content">
                <span className="contact-item__label">Телефон для бронирования</span>
                <a href="tel:+74959990088" className="contact-item__value contact-item__value--link">
                  +7 (495) 999-00-88
                </a>
                <span className="contact-item__hint">Консьерж-сервис и персональный мастер-приемщик</span>
              </div>
            </div>

            <div className="contact-item">
              <div className="contact-item__icon">💬</div>
              <div className="contact-item__content">
                <span className="contact-item__label">Мессенджеры</span>
                <div className="social-links">
                  <a href="https://t.me" target="_blank" rel="noreferrer" className="social-pill">
                    <span className="social-pill__icon">✈️</span>
                    <span>Telegram</span>
                  </a>
                  <a href="https://whatsapp.com" target="_blank" rel="noreferrer" className="social-pill">
                    <span className="social-pill__icon">🟢</span>
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>

            <div className="lounge-perk">
              <span className="lounge-perk__star">✦</span>
              <div className="lounge-perk__body">
                <p>Для клиентов доступна VIP-лаундж зона с Wi-Fi, напитками и трансляцией процесса работы из бокса.</p>
                <button
                  type="button"
                  className="lounge-perk__btn"
                  onClick={handleBookingClick}
                >
                  Забронировать VIP-визит →
                </button>
              </div>
            </div>
          </div>

          {/* Quick Contact Form */}
          <div className="contacts-form-card">
            <h3 className="form-card__title">Задать вопрос технологу</h3>
            <p className="form-card__subtitle">
              Оставьте заявку на бесплатную диагностику ЛКП и подбор программы ухода.
            </p>

            {errorMsg && (
              <div className="contact-error-banner">
                ⚠️ {errorMsg}
              </div>
            )}

            {submitted ? (
              <div className="form-success">
                <div className="success-icon">✓</div>
                <h4>Заявка успешно принята!</h4>
                <p>Наш мастер-технолог свяжется с вами в течение 10 минут.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-group">
                  <label htmlFor="contact-name">Ваше имя *</label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    placeholder="Александр"
                    value={formData.name}
                    disabled={isSubmitting}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="contact-phone">Номер телефона *</label>
                  <input
                    id="contact-phone"
                    type="tel"
                    required
                    placeholder="+7 (___) ___-__-__"
                    value={formData.phone}
                    disabled={isSubmitting}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="contact-car">Марка и модель автомобиля</label>
                  <input
                    id="contact-car"
                    type="text"
                    placeholder="Например: Porsche Macan GTS"
                    value={formData.carModel}
                    disabled={isSubmitting}
                    onChange={(e) => setFormData({ ...formData, carModel: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="contact-msg">Интересующая услуга или вопрос</label>
                  <textarea
                    id="contact-msg"
                    rows="3"
                    placeholder="Хочу сделать керамику и химчистку..."
                    value={formData.question}
                    disabled={isSubmitting}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="btn-gold form-submit-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Отправка...' : 'Отправить заявку'}
                </button>

                <p className="form-privacy">
                  Нажимая кнопку, вы соглашаетесь на обработку персональных данных.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
