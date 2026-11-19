import { useState, useEffect } from 'react';
import './BookingModal.css';

const defaultServices = [
  'Восстановительная полировка',
  'Нанокерамика 9H Pro',
  'Премиум-химчистка салона',
  'Оклейка полиуретаном PPF',
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;
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
    }, 3000);
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
          aria-label="Закрыть"
        >
          ✕
        </button>

        {submitted ? (
          <div className="modal-success">
            <div className="modal-success__icon">✦</div>
            <h3 className="modal-success__title">Запись подтверждена!</h3>
            <p className="modal-success__text">
              Спасибо, <strong>{formData.name}</strong>! Персональный консьерж свяжется с вами по номеру{' '}
              <strong>{formData.phone}</strong> для уточнения деталей.
            </p>
            <div className="modal-success__bar"></div>
          </div>
        ) : (
          <>
            <div className="modal-header">
              <span className="modal-tag">ОНЛАЙН-БРОНИРОВАНИЕ</span>
              <h3 className="modal-title">Запись на детейлинг</h3>
              <p className="modal-subtitle">
                Заполните форму, и мы забронируем индивидуальный чистый бокс для вашего авто.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="modal-field">
                  <label htmlFor="modal-name">Ваше имя *</label>
                  <input
                    id="modal-name"
                    type="text"
                    required
                    placeholder="Константин"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="modal-field">
                  <label htmlFor="modal-phone">Телефон *</label>
                  <input
                    id="modal-phone"
                    type="tel"
                    required
                    placeholder="+7 (___) ___-__-__"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="modal-field">
                  <label htmlFor="modal-car">Автомобиль (Марка/Модель)</label>
                  <input
                    id="modal-car"
                    type="text"
                    placeholder="Например: Mercedes-AMG GT"
                    value={formData.car}
                    onChange={(e) => setFormData({ ...formData, car: e.target.value })}
                  />
                </div>

                <div className="modal-field">
                  <label htmlFor="modal-service">Желаемая услуга</label>
                  <select
                    id="modal-service"
                    value={formData.service}
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
                  <label htmlFor="modal-date">Желаемая дата</label>
                  <input
                    id="modal-date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>

                <div className="modal-field">
                  <label htmlFor="modal-slot">Удобное время приёмки</label>
                  <select
                    id="modal-slot"
                    value={formData.timeSlot}
                    onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                  >
                    <option value="10:00 — 12:00">Утро (10:00 — 12:00)</option>
                    <option value="12:00 — 15:00">День (12:00 — 15:00)</option>
                    <option value="15:00 — 19:00">Вечер (15:00 — 19:00)</option>
                    <option value="19:00 — 23:00">Поздний вечер (19:00 — 23:00)</option>
                    <option value="Ночь 24/7">Ночная смена (по договорённости)</option>
                  </select>
                </div>
              </div>

              <div className="modal-field">
                <label htmlFor="modal-comment">Особые пожелания (необязательно)</label>
                <textarea
                  id="modal-comment"
                  rows="2"
                  placeholder="Например: требуется предварительный осмотр ЛКП или трансфер"
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                ></textarea>
              </div>

              <button type="submit" className="btn-gold modal-submit-btn">
                Забронировать бокс
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
