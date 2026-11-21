import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPricingData } from '../api/bookingApi';
import './Pricing.css';

const defaultCarClasses = [
  { id: 'sedan', label: 'Седан / Купе', multiplier: 1, example: 'BMW 3/5, Porsche 911, Mercedes E-Class' },
  { id: 'crossover', label: 'Кроссовер', multiplier: 1.2, example: 'BMW X3/X5, Porsche Macan/Cayenne' },
  { id: 'suv', label: 'Внедорожник / SUV', multiplier: 1.4, example: 'Mercedes G-Class, Range Rover, GLS' }
];

const defaultPackages = [
  {
    id: 'pkg-light',
    title: 'Executive Care',
    tag: 'РЕГУЛЯРНЫЙ УХОД',
    basePrice: 9500,
    time: '4–6 часов',
    featured: false,
    description: 'Идеальный комплекс для поддержания безупречной чистоты кузова и уюта в салоне.',
    items: [
      '3-фазная детейлинг-мойка с кистями',
      'Очистка дисков от тормозной пыли',
      'Гидрофобное кварцевое покрытие ЛКП',
      'Деликатная уборка салона пылесосом и кистями',
      'Кондиционер для кожи с матовым эффектом',
      'Матовое чернение резины премиум-составом'
    ]
  },
  {
    id: 'pkg-ceramic',
    title: 'Ceramic Elite',
    tag: 'АБСОЛЮТНЫЙ ХИТ',
    basePrice: 48000,
    time: '2 дня',
    featured: true,
    description: 'Максимальный глянец, устранение рисок и многослойная защита керамикой 9H.',
    items: [
      'Полная деконтаминация ЛКП синтетической глиной',
      'Мягкая полировка с удалением до 90% паутинки',
      '2 слоя керамического покрытия 9H Pro',
      'Гидрофобный слой «Антидождь» на все стёкла',
      'Термосушка в ИК-камере для закрепления',
      'Защитная пропитка кожаных элементов салона'
    ]
  },
  {
    id: 'pkg-royal',
    title: 'Royal Perfection',
    tag: 'ЭКСКЛЮЗИВНЫЙ КОМПЛЕКС',
    basePrice: 115000,
    time: '3–4 дня',
    featured: false,
    description: 'Бескомпромиссная реставрация, бронирование зон риска и музейный уровень блеска.',
    items: [
      'Глубокая восстановительная полировка кузова',
      '3 слоя нанокерамики 10H + гидрофобный Top Coat',
      'Оклейка зон риска полиуретановой пленкой PPF',
      'Полная химчистка салона со снятием сидений',
      'Озонирование и дезинфекция системы кондиционирования',
      'Сертификат и гарантийная книжка на 3 года'
    ]
  }
];

export default function Pricing({ onSelectPackage, hideHeader = false }) {
  const [carClassesList, setCarClassesList] = useState(defaultCarClasses);
  const [packagesList, setPackagesList] = useState(defaultPackages);
  const [selectedClass, setSelectedClass] = useState('sedan');
  const navigate = useNavigate();

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
    return new Intl.NumberFormat('ru-RU').format(total) + ' ₽';
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
          <div className="section-header">
            <div className="gold-sub-title">ПРОЗРАЧНЫЙ ПРАЙС-ЛИСТ</div>
            <h2 className="section-title">
              Пакеты услуг и <span className="gold-text">калькулятор стоимости</span>
            </h2>
            <p className="section-desc">
              Выберите класс вашего автомобиля, чтобы увидеть точную расчетную стоимость
              готовых комплексов детейлинга.
            </p>
          </div>
        )}

        {/* Car Class Selector Tabs */}
        <div className="class-selector">
          <span className="class-selector__label">Класс автомобиля:</span>
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

        {/* Packages Cards */}
        <div className="pricing-grid">
          {packagesList.map((pkg) => (
            <div
              key={pkg.id}
              className={`pricing-card ${pkg.featured ? 'pricing-card--featured' : ''}`}
            >
              {pkg.featured && (
                <div className="pricing-badge">РЕКОМЕНДУЕМ</div>
              )}

              <div className="pricing-card__header">
                <span className="pricing-tag">{pkg.tag}</span>
                <h3 className="pricing-card__title">{pkg.title}</h3>
                <p className="pricing-card__desc">{pkg.description}</p>
                {pkg.time && (
                  <div className="pricing-time">Срок выполнения: <strong>{pkg.time}</strong></div>
                )}
              </div>

              <div className="pricing-card__cost">
                <span className="cost-from">Стоимость:</span>
                <div className="cost-amount gold-text">
                  {formatPrice(pkg.basePrice)}
                </div>
              </div>

              <ul className="pricing-card__list">
                {pkg.items.map((item, idx) => (
                  <li key={idx} className="pricing-list-item">
                    <span className="pricing-check">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                className={pkg.featured ? 'btn-gold pricing-btn' : 'btn-outline pricing-btn'}
                onClick={() => handleSelect(pkg.title)}
              >
                Выбрать комплекс
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
