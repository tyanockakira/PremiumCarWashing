import './Services.css';

const servicesData = [
  {
    id: 'polishing',
    title: 'Восстановительная полировка',
    tag: 'ГЛУБОКИЙ ГЛЯНЕЦ',
    price: 'от 18 000 ₽',
    duration: '1–2 дня',
    image: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&w=800&q=80',
    description: 'Многоэтапное удаление царапин, паутинок и оксидного слоя с сохранением максимальной толщины заводского лака.',
    features: [
      'Устранение до 98% дефектов и рисок',
      'Пасты и полировальные круги Rupes & Koch Chemie',
      'Контроль толщины ЛКП ультразвуковым сканером',
      'Финишная антиголограммная обработка'
    ],
    badgeColor: 'gold'
  },
  {
    id: 'ceramic',
    title: 'Нанокерамика 9H Pro',
    tag: 'ХИТ ЗАЩИТЫ',
    featured: true,
    price: 'от 35 000 ₽',
    duration: '2–3 дня',
    image: 'https://images.unsplash.com/photo-1619405399517-d7fce0f13302?auto=format&fit=crop&w=800&q=80',
    description: 'Нанесение многослойной керамической брони Gyeon Quartz с гидрофобным эффектом и зеркальной глубиной цвета.',
    features: [
      'Защита от реагентов, смол и выгорания цвета',
      'Экстремальный водо- и грязеотталкивающий эффект',
      'Нанесение 2–4 слоёв с ИК-сушкой',
      'Сертификат и гарантия на стойкость 24–36 месяцев'
    ],
    badgeColor: 'gold-solid'
  },
  {
    id: 'interior',
    title: 'Премиум-химчистка салона',
    tag: 'СПА ДЛЯ САЛОНА',
    price: 'от 16 000 ₽',
    duration: '1–2 дня',
    image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80',
    description: 'Деликатная химчистка всех поверхностей с озонированием и консервацией кожи натуральными швейцарскими составами.',
    features: [
      'Глубокая очистка кожи, алькантары и текстиля',
      'Антибактериальная обработка и озонирование',
      'Питание и защита кожи кремами LeTech',
      'Безопасная эко-химия без резких запахов'
    ],
    badgeColor: 'gold'
  },
  {
    id: 'ppf',
    title: 'Оклейка полиуретаном PPF',
    tag: 'БРОНЕПЛЕНКА',
    price: 'от 65 000 ₽',
    duration: '2–4 дня',
    image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80',
    description: 'Невидимый барьер от сколов, гравия, царапин и притёртостей пленками премиум-сегмента SunTek и Stek.',
    features: [
      'Эффект самозатягивания царапин при нагреве',
      'Толщина полиуретана до 220 микрон',
      'Идеальный раскрой по фирменным лекалам',
      'Официальная гарантия производителя 7 лет'
    ],
    badgeColor: 'gold'
  }
];

export default function Services({ onSelectService }) {
  return (
    <section id="services" className="services-section">
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <div className="gold-sub-title">ЭКСКЛЮЗИВНЫЕ УСЛУГИ</div>
          <h2 className="section-title">
            Индивидуальные программы <span className="gold-text">детейлинга</span>
          </h2>
          <p className="section-desc">
            Мы объединяем передовое оборудование, проверенные европейские составы
            и филигранную ручную работу для безукоризненного результата.
          </p>
        </div>

        {/* Services Grid */}
        <div className="services-grid">
          {servicesData.map((service) => (
            <article 
              key={service.id} 
              className={`service-card ${service.featured ? 'service-card--featured' : ''}`}
            >
              {service.featured && (
                <div className="card-popular-pill">
                  ВЫБОР КЛИЕНТОВ
                </div>
              )}

              {/* Image & Header */}
              <div className="service-card__media">
                <img 
                  src={service.image} 
                  alt={service.title}
                  className="service-card__img"
                  loading="lazy"
                />
                <div className="service-card__overlay"></div>
                <span className="service-card__tag">{service.tag}</span>
                <span className="service-card__duration">⏱ {service.duration}</span>
              </div>

              {/* Body */}
              <div className="service-card__body">
                <h3 className="service-card__title">{service.title}</h3>
                <p className="service-card__desc">{service.description}</p>

                {/* Features list */}
                <ul className="service-card__features">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="feature-item">
                      <span className="feature-check">✦</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Card Footer: Price & CTA */}
                <div className="service-card__footer">
                  <div className="service-price-block">
                    <span className="price-label">Стоимость:</span>
                    <span className="price-value gold-text">{service.price}</span>
                  </div>

                  <button 
                    type="button"
                    className="service-card__btn"
                    onClick={() => onSelectService(service.title)}
                  >
                    <span>Записаться</span>
                    <span className="btn-icon">→</span>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
