import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { getPricingData } from '../api/bookingApi';
import { ArrowRightIcon, CheckIcon, ClockIcon } from './Icons';
import { DetailReveal } from './DetailPageParts';
import { useDetailReducedMotion } from './useDetailReducedMotion';
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
    tag: 'Регулярний догляд',
    basePrice: 4500,
    time: '4–6 годин',
    featured: false,
    description: 'Миття кузова, кварцовий захист лаку та догляд за салоном.',
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
    tag: 'Керамічний захист',
    basePrice: 22000,
    time: '2 дні',
    featured: true,
    description: 'Корекція дрібних рисок і багатошаровий захист керамікою 9H Pro.',
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
    tag: 'Комплексний захист',
    basePrice: 55000,
    time: '3–4 дні',
    featured: false,
    description: 'Відновлення кузова, захист зон ризику плівкою та глибоке очищення салону.',
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

const numberFormat = new Intl.NumberFormat('uk-UA');
const ease = [0.16, 1, 0.3, 1];

function formatPrice(base, multiplier) {
  const total = Math.round((base * multiplier) / 500) * 500;
  return `${numberFormat.format(total)} грн`;
}

function PackagePrice({ value, reduceMotion }) {
  return (
    <span className="pricing-plan__amount">
      <span className="detail-sr-only">{value}</span>
      {reduceMotion ? (
        <span aria-hidden="true">{value}</span>
      ) : (
        <AnimatePresence initial={false}>
          <motion.span
            key={value}
            aria-hidden="true"
            initial={{ opacity: 0, y: '38%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '-38%' }}
            transition={{ duration: 0.27, ease }}
          >
            {value}
          </motion.span>
        </AnimatePresence>
      )}
    </span>
  );
}

export default function Pricing() {
  const [carClassesList, setCarClassesList] = useState(defaultCarClasses);
  const [packagesList, setPackagesList] = useState(defaultPackages);
  const [selectedClass, setSelectedClass] = useState('sedan');
  const reduceMotion = useDetailReducedMotion();

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
              tag: p.tag || 'Пакет догляду',
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

  const currentClassIndex = Math.max(0, carClassesList.findIndex(({ id }) => id === selectedClass));
  const currentClass = carClassesList[currentClassIndex];
  const indicatorOffset = `${currentClassIndex * 100}%`;
  const packages = packagesList.map((pkg) => ({
    ...pkg,
    price: formatPrice(pkg.basePrice, currentClass.multiplier),
  }));

  return (
    <section id="pricing" className="cinema-container pricing-calculator" aria-label="Тарифи та калькулятор вартості">
      <fieldset id="car-class" className="pricing-classes" tabIndex={-1}>
        <legend>Клас автомобіля</legend>
        <div className="pricing-classes__layout">
          <div className="pricing-classes__options" style={{ '--class-count': carClassesList.length }}>
            <motion.span
              className="pricing-classes__indicator"
              aria-hidden="true"
              initial={false}
              style={{ '--indicator-offset': indicatorOffset }}
              animate={{ x: indicatorOffset }}
              transition={{ duration: reduceMotion ? 0 : 0.38, ease }}
            />
            {carClassesList.map((item) => (
              <label key={item.id}>
                <input
                  type="radio"
                  name="car-class"
                  value={item.id}
                  checked={currentClass.id === item.id}
                  aria-describedby={currentClass.id === item.id && item.example ? 'car-class-example' : undefined}
                  onChange={() => setSelectedClass(item.id)}
                />
                <span>{item.label === 'Седан / Купе' ? 'Седан / купе' : item.label}</span>
              </label>
            ))}
          </div>
          <p id="car-class-example" className="pricing-classes__example">{currentClass.example}</p>
        </div>
      </fieldset>

      <p className="detail-sr-only" role="status">
        {packages.map(({ title, price }) => `${title} — ${price}`).join('. ')}
      </p>
      <div className="pricing-comparison">
        {packages.map((pkg, index) => (
          <DetailReveal
            as={motion.article}
            key={pkg.id}
            aria-labelledby={`package-title-${index}`}
            className="pricing-plan"
            data-featured={pkg.featured}
            delay={Math.min(index, 2) * 0.07}
          >
            <header className="pricing-plan__header">
              <p className="pricing-plan__tag">{pkg.featured ? 'Рекомендуємо' : pkg.tag}</p>
              <h2 id={`package-title-${index}`} lang="en">{pkg.title}</h2>
              <p className="pricing-plan__description">{pkg.description}</p>
            </header>
            <ul className="detail-checklist pricing-plan__items" aria-label="Що входить у пакет">
              {pkg.items.map((item, index) => (
                <li key={index}><CheckIcon size={16} /><span>{item}</span></li>
              ))}
            </ul>
            <div className="pricing-plan__meta">
              {pkg.time && <p><ClockIcon size={16} /><span className="detail-sr-only">Тривалість </span>{pkg.time}</p>}
            </div>
            <div className="pricing-plan__footer">
              <div>
                <p className="pricing-plan__estimate">Орієнтовно</p>
                <PackagePrice value={pkg.price} reduceMotion={reduceMotion} />
              </div>
              <Link
                to="/booking"
                state={{ service: `${pkg.title} (${currentClass.label})` }}
                className={`cinema-button ${pkg.featured ? 'btn-platinum' : 'btn-outline'}`}
                aria-label={`Обрати комплекс ${pkg.title}`}
              >
                Обрати <ArrowRightIcon size={16} className="cinema-arrow cinema-arrow--diagonal" />
              </Link>
            </div>
          </DetailReveal>
        ))}
      </div>

      <DetailReveal as={motion.section} className="pricing-calculator__guide" aria-labelledby="calculator-heading">
        <div>
          <h2 id="calculator-heading" className="cinema-heading detail-section__title">Калькулятор вартості</h2>
          <p>Виберіть клас авто, щоб перерахувати ціни всіх пакетів. Суми округлюються до найближчих 500 грн.</p>
        </div>
        <a href="#car-class" className="btn-outline cinema-button">
          Змінити клас авто <ArrowRightIcon size={16} className="cinema-arrow cinema-arrow--diagonal" />
        </a>
      </DetailReveal>
    </section>
  );
}
