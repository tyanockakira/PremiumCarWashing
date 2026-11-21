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
      console.error('Помилка відправлення форми:', err);
      setErrorMsg('Не вдалося надіслати заявку. Будь ласка, зателефонуйте нам або спробуйте пізніше.');
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
            <div className="tech-sub-title">ЯК НАС ЗНАЙТИ</div>
            <h2 className="section-title">
              Контакти та <span className="platinum-text">локація студії</span>
            </h2>
            <p className="section-desc">
              Чекаємо на вас у зручній локації із власною охоронюваною територією,
              лаундж-зоною з добірною кавою та швидкісним Wi-Fi.
            </p>
          </div>
        )}

        <div className="contacts-grid">
          {/* Info Card */}
          <div className="contacts-info">
            <div className="contact-item">
              <div className="contact-item__icon">📍</div>
              <div className="contact-item__content">
                <span className="contact-item__label">Адреса студії</span>
                <p className="contact-item__value">м. Київ, вул. Автомобільна, 1</p>
                <span className="contact-item__hint">Закритий в&apos;їзд під охороною (демонстраційна адреса)</span>
              </div>
            </div>

            <div className="contact-item">
              <div className="contact-item__icon">⏱️</div>
              <div className="contact-item__content">
                <span className="contact-item__label">Графік роботи</span>
                <p className="contact-item__value">Цілодобово — 24/7</p>
                <span className="contact-item__hint">Прийом та видача авто за попереднім записом</span>
              </div>
            </div>

            <div className="contact-item">
              <div className="contact-item__icon">📞</div>
              <div className="contact-item__content">
                <span className="contact-item__label">Телефон для бронювання</span>
                <a href="tel:+380440000000" className="contact-item__value contact-item__value--link">
                  +380 (44) 000-00-00
                </a>
                <span className="contact-item__hint">Консьєрж-сервіс (демонстраційний номер)</span>
              </div>
            </div>

            <div className="contact-item">
              <div className="contact-item__icon">💬</div>
              <div className="contact-item__content">
                <span className="contact-item__label">Месенджери</span>
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
                <p>Для гостей доступна VIP-лаундж зона з кавою, Wi-Fi та прямою трансляцією процесу робіт із боксу.</p>
                <button
                  type="button"
                  className="lounge-perk__btn"
                  onClick={handleBookingClick}
                >
                  Забронювати VIP-візит →
                </button>
              </div>
            </div>
          </div>

          {/* Quick Contact Form */}
          <div className="contacts-form-card">
            <h3 className="form-card__title">Задати питання технологу</h3>
            <p className="form-card__subtitle">
              Залиште запит на діагностику стану ЛФП та професійний підбір програми догляду.
            </p>

            {errorMsg && (
              <div className="contact-error-banner">
                ⚠️ {errorMsg}
              </div>
            )}

            {submitted ? (
              <div className="form-success">
                <div className="success-icon">✓</div>
                <h4>Запит успішно прийнято!</h4>
                <p>Наш майстер-технолог зв&apos;яжеться з вами протягом 10 хвилин (демо-режим).</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-group">
                  <label htmlFor="contact-name">Ваше ім&apos;я *</label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    placeholder="Олександр"
                    value={formData.name}
                    disabled={isSubmitting}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="contact-phone">Номер телефону *</label>
                  <input
                    id="contact-phone"
                    type="tel"
                    required
                    placeholder="+380 (__) ___-__-__"
                    value={formData.phone}
                    disabled={isSubmitting}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="contact-car">Марка та модель автомобіля</label>
                  <input
                    id="contact-car"
                    type="text"
                    placeholder="Наприклад: Porsche Macan GTS"
                    value={formData.carModel}
                    disabled={isSubmitting}
                    onChange={(e) => setFormData({ ...formData, carModel: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="contact-msg">Бажана послуга або запитання</label>
                  <textarea
                    id="contact-msg"
                    rows="3"
                    placeholder="Цікавить нанесення кераміки та хімчистка..."
                    value={formData.question}
                    disabled={isSubmitting}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="btn-platinum form-submit-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Надсилання...' : 'Надіслати запит'}
                </button>

                <p className="form-privacy">
                  🔒 Демонстраційний сайт. Дані обробляються виключно в навчальних цілях.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
