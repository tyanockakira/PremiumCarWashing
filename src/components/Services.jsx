import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { getServices } from '../api/bookingApi';
import { CheckIcon, ArrowRightIcon, ClockIcon } from './Icons';
import './Services.css';

const defaultServicesData = [
  {
    id: 'polishing',
    title: 'Відновлювальне полірування',
    tag: 'ГЛИБОКИЙ ГЛЯНЕЦЬ',
    price: 'від 8 500 грн',
    duration: '1–2 дні',
    image: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&w=800&q=80',
    description: 'Багатоетапне усунення подряпин, павутинок та оксидного шару зі збереженням максимальної товщини заводського лаку.',
    features: [
      'Усунення до 98% дефектів і рисок',
      'Пасти та полірувальні круги Rupes & Koch Chemie',
      'Контроль товщини ЛФП ультразвуковим сканером',
      'Фінішна антиголограмна обробка'
    ],
    badgeColor: 'platinum'
  },
  {
    id: 'ceramic',
    title: 'Нанокераміка 9H Pro',
    tag: 'ХІТ ЗАХИСТУ',
    featured: true,
    price: 'від 16 000 грн',
    duration: '2–3 дні',
    image: 'https://images.unsplash.com/photo-1619405399517-d7fce0f13302?auto=format&fit=crop&w=800&q=80',
    description: 'Нанесення багатошарової керамічної броні Gyeon Quartz із гідрофобним ефектом і дзеркальною глибиною кольору.',
    features: [
      'Захист від реагентів, смол і бруду',
      'Екстремальний водовідштовхувальний ефект',
      'Нанесення 2–4 шарів з ІЧ-сушкою',
      'Сертифікат та гарантія на стійкість 24–36 місяців'
    ],
    badgeColor: 'platinum-solid'
  },
  {
    id: 'interior',
    title: 'Преміум-хімчистка салону',
    tag: 'СПА ДЛЯ САЛОНУ',
    price: 'від 7 500 грн',
    duration: '1–2 дні',
    image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80',
    description: 'Делікатна хімчистка всіх поверхонь із озонуванням та консервацією шкіри натуральними швейцарськими складами.',
    features: [
      'Глибоке очищення шкіри, алькантари та текстилю',
      'Антибактеріальна обробка та озонування',
      'Живлення та захист шкіри кремами LeTech',
      'Безпечна еко-хімія без сторонніх запахів'
    ],
    badgeColor: 'platinum'
  },
  {
    id: 'ppf',
    title: 'Обклеювання поліуретаном PPF',
    tag: 'БРОНЕПЛІВКА',
    price: 'від 32 000 грн',
    duration: '2–4 дні',
    image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80',
    description: 'Невидимий бар’єр від відколів, гравію, подряпин та притертостей плівками преміум-сегмента SunTek і Stek.',
    features: [
      'Ефект самозатягування подряпин під час нагрівання',
      'Товщина поліуретану до 220 мікронів',
      'Ідеальний розкрій за фірмовими лекалами',
      'Офіційна гарантія виробника 7 років'
    ],
    badgeColor: 'platinum'
  }
];

export default function Services({ onSelectService, hideHeader = false }) {
  const [services, setServices] = useState(defaultServicesData);
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    let isMounted = true;
    getServices().then((data) => {
      if (isMounted && data && data.length > 0) {
        setServices(
          data.map((item) => ({
            id: item.slug || item.id,
            title: item.title,
            tag: item.tag || 'ПРЕМІУМ',
            featured: Boolean(item.is_featured),
            price: `від ${new Intl.NumberFormat('uk-UA').format(item.base_price)} грн`,
            duration: item.duration_text || '',
            image: item.image_url || defaultServicesData[0].image,
            description: item.description,
            features: item.features || []
          }))
        );
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleBook = (title) => {
    if (onSelectService) {
      onSelectService(title);
    } else {
      navigate('/booking', { state: { service: title } });
    }
  };

  return (
    <section id="services" className="services-section">
      <div className="container">
        {/* Section Header */}
        {!hideHeader && (
          <motion.div
            className="section-header"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="tech-sub-title">ЕКСКЛЮЗИВНІ ПОСЛУГИ</div>
            <h2 className="section-title">
              Індивідуальні програми <span className="platinum-text">дітейлінгу</span>
            </h2>
            <p className="section-desc">
              Ми поєднуємо передове обладнання, перевірені європейські склади
              та філігранну ручну роботу для бездоганного результату.
            </p>
          </motion.div>
        )}

        {/* Services Grid with Motion Stagger */}
        <div className="services-grid">
          {services.map((service, index) => (
            <motion.article
              key={service.id}
              className={`service-card ${service.featured ? 'service-card--featured' : ''}`}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
              whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.5, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              {service.featured && (
                <div className="card-popular-pill">
                  ВИБІР КЛІЄНТІВ
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
                {service.duration && (
                  <span className="service-card__duration" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <ClockIcon size={13} />
                    <span>{service.duration}</span>
                  </span>
                )}
              </div>

              {/* Body */}
              <div className="service-card__body">
                <h3 className="service-card__title">{service.title}</h3>
                <p className="service-card__desc">{service.description}</p>

                {/* Features list */}
                <ul className="service-card__features">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="feature-item">
                      <span className="feature-check" style={{ display: 'inline-flex', marginTop: '2px' }}>
                        <CheckIcon size={14} />
                      </span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Card Footer: Price & CTA */}
                <div className="service-card__footer">
                  <div className="service-price-block">
                    <span className="price-label">Орієнтовна вартість:</span>
                    <span className="price-value platinum-text">{service.price}</span>
                  </div>

                  <button
                    type="button"
                    className="service-card__btn"
                    onClick={() => handleBook(service.title)}
                  >
                    <span>Записатися</span>
                    <span className="btn-icon">
                      <ArrowRightIcon size={14} />
                    </span>
                  </button>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
