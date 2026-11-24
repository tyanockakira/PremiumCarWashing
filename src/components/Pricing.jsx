import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { getPricingData } from '../api/bookingApi';
import { CheckIcon } from './Icons';
import './Pricing.css';

const defaultCarClasses = [
  { id: 'sedan', label: 'Седан / Купе', multiplier: 1, example: 'BMW 3/5, Porsche 911, Mercedes E-Class' },
  { id: 'crossover', label: 'Кросовер', multiplier: 1.2, example: 'BMW X3/X5, Porsche Macan/Cayenne' },
  { id: 'suv', label: 'Позашляховик / SUV', multiplier: 1.4, example: 'Mercedes G-Class, Range Rover, GLS' }
];

const defaultPackages = [
  {
    id: 'pkg-light',
    title: 'Executive Care',
    tag: 'РЕГУЛЯРНИЙ ДОГЛЯД',
    basePrice: 4500,
    time: '4–6 годин',
    featured: false,
    description: 'Ідеальний комплекс для підтримання бездоганної чистоти кузова та затишку в салоні.',
    items: [
      '3-фазне дітейлінг-миття з пензлями',
      'Очищення дисків від гальмівного пилу',
      'Гідрофобне кварцове покриття ЛФП',
      'Делікатне прибирання салону пилососом і пензлями',
      'Кондиціонер для шкіри з матовим ефектом',
      'Матове чорніння гуми преміум-складом'
    ]
  },
  {
    id: 'pkg-ceramic',
    title: 'Ceramic Elite',
    tag: 'АБСОЛЮТНИЙ ХІТ',
    basePrice: 22000,
    time: '2 дні',
    featured: true,
    description: 'Максимальний глянець, усунення рисок та багатошаровий захист керамікою 9H Pro.',
    items: [
      'Повна деконтамінація ЛФП синтетичною глиною',
      'М’яке полірування з усуненням до 90% павутинки',
      '2 шари керамічного покриття 9H Pro',
      'Гідрофобний шар «Антидощ» на всі вікна',
      'Термосушка в ІЧ-камері для закріплення',
      'Захисне просочення шкіряних елементів салону'
    ]
  },
  {
    id: 'pkg-royal',
    title: 'Royal Perfection',
    tag: 'ЕКСКЛЮЗИВНИЙ КОМПЛЕКС',
    basePrice: 55000,
    time: '3–4 дні',
    featured: false,
    description: 'Безкомпромісна реставрація, бронювання зон ризику та музейний рівень блиску.',
    items: [
      'Глибоке відновлювальне полірування кузова',
      '3 шари нанокераміки 10H + гідрофобний Top Coat',
      'Обклеювання зон ризику поліуретановою плівкою PPF',
      'Повна хімчистка салону зі зняттям сидінь',
      'Озонування та дезінфекція системи кондиціонування',
      'Сертифікат та гарантійна книжка на 3 роки'
    ]
  }
];

export default function Pricing({ onSelectPackage, hideHeader = false }) {
  const [carClassesList, setCarClassesList] = useState(defaultCarClasses);
  const [packagesList, setPackagesList] = useState(defaultPackages);
  const [selectedClass, setSelectedClass] = useState('sedan');
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    let isMounted = true;
    getPricingData().then((res) => {
      if (isMounted && res) {
        if (res.carClasses && res.carClasses.length > 0) {
          setCarClassesList(
            res.carClasses.map((c) => ({
              id: c.id,
              label: c.label,
              multiplier: Number(c.multiplier) || 1,
              example: c.example_models || ''
            }))
          );
        }
        if (res.packages && res.packages.length > 0) {
          setPackagesList(
            res.packages.map((p) => ({
              id: p.id,
              title: p.title,
              tag: p.tag || 'ТАРИФ',
              basePrice: p.base_price,
              time: p.time_text || '',
              featured: Boolean(p.is_featured),
              description: p.description,
              items: p.items || []
            }))
          );
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const currentClassObj = carClassesList.find((c) => c.id === selectedClass) || carClassesList[0];
  const multiplier = currentClassObj ? currentClassObj.multiplier : 1;

  const formatPrice = (base) => {
    const total = Math.round((base * multiplier) / 500) * 500;
    return new Intl.NumberFormat('uk-UA').format(total) + ' грн';
  };

  const handleSelect = (pkgTitle) => {
    const fullTitle = `${pkgTitle} (${currentClassObj?.label})`;
    if (onSelectPackage) {
      onSelectPackage(fullTitle);
    } else {
      navigate('/booking', { state: { service: fullTitle } });
    }
  };

  return (
    <section id="pricing" className="pricing-section">
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
            <div className="tech-sub-title">ПРОЗОРИЙ ПРАЙС-ЛИСТ</div>
            <h2 className="section-title">
              Пакети послуг і <span className="platinum-text">калькулятор вартості</span>
            </h2>
            <p className="section-desc">
              Оберіть клас вашого автомобіля, щоб побачити точну розрахункову вартість
              готових комплексів дітейлінгу.
            </p>
          </motion.div>
        )}

        {/* Car Class Selector Tabs */}
        <div className="class-selector">
          <span className="class-selector__label">Клас автомобіля:</span>
          <div className="class-selector__tabs">
            {carClassesList.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`class-tab ${selectedClass === item.id ? 'class-tab--active' : ''}`}
                onClick={() => setSelectedClass(item.id)}
              >
                <span className="class-tab__title">{item.label}</span>
                <span className="class-tab__example">{item.example}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Packages Cards with Motion Stagger */}
        <div className="pricing-grid">
          {packagesList.map((pkg, idx) => (
            <motion.div
              key={pkg.id}
              className={`pricing-card ${pkg.featured ? 'pricing-card--featured' : ''}`}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
              whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.5, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              {pkg.featured && (
                <div className="pricing-badge">РЕКОМЕНДУЄМО</div>
              )}

              <div className="pricing-card__header">
                <span className="pricing-tag">{pkg.tag}</span>
                <h3 className="pricing-card__title">{pkg.title}</h3>
                <p className="pricing-card__desc">{pkg.description}</p>
                {pkg.time && (
                  <div className="pricing-time">Термін виконання: <strong>{pkg.time}</strong></div>
                )}
              </div>

              <div className="pricing-card__cost">
                <span className="cost-from">Орієнтовна вартість:</span>
                <div className="cost-amount platinum-text">
                  {formatPrice(pkg.basePrice)}
                </div>
              </div>

              <ul className="pricing-card__list">
                {pkg.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="pricing-list-item">
                    <span className="pricing-check" style={{ display: 'inline-flex', marginTop: '2px' }}>
                      <CheckIcon size={14} />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                className={pkg.featured ? 'btn-platinum pricing-btn' : 'btn-outline pricing-btn'}
                onClick={() => handleSelect(pkg.title)}
              >
                Обрати комплекс
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
