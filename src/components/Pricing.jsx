import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getPricingData } from '../api/bookingApi';
import { defaultCarClasses } from '../data/carClasses';
import { ArrowRightIcon, CheckIcon, ClockIcon } from './Icons';
import { useDetailReducedMotion } from './useDetailReducedMotion';
import { duration, easeGlide } from '../lib/motion';
import './Pricing.css';

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
const priceTiming = { duration: duration.price * 1000, easing: `cubic-bezier(${easeGlide.join(', ')})` };

function calculatePrice(base, multiplier) {
  return Math.round((base * multiplier) / 500) * 500;
}

function PackagePrice({ amount, widthSample, reduceMotion }) {
  const previousAmount = useRef(amount);
  const current = useRef(null);
  const outgoing = useRef(null);
  const formatted = numberFormat.format(amount);

  useLayoutEffect(() => {
    const previous = previousAmount.current;
    previousAmount.current = amount;

    if (reduceMotion || previous === amount) return;

    const offset = amount > previous ? '100%' : '-100%';
    const exit = amount > previous ? '-100%' : '100%';
    outgoing.current.textContent = numberFormat.format(previous);

    const enterAnimation = current.current.animate(
      [{ transform: `translateY(${offset})` }, { transform: 'translateY(0)' }],
      priceTiming,
    );
    const exitAnimation = outgoing.current.animate(
      [{ transform: 'translateY(0)', visibility: 'visible' }, { transform: `translateY(${exit})`, visibility: 'visible' }],
      priceTiming,
    );

    return () => {
      enterAnimation.cancel();
      exitAnimation.cancel();
    };
  }, [amount, reduceMotion]);

  return (
    <span className="pricing-plan__amount">
      <span className="detail-sr-only">{formatted} грн</span>
      <span className="pricing-plan__digits" data-width={widthSample} aria-hidden="true">
        <span className="pricing-plan__previous" ref={outgoing} />
        <span ref={current}>{formatted}</span>
      </span>
      <span aria-hidden="true">грн</span>
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
    amount: calculatePrice(pkg.basePrice, currentClass.multiplier),
    widthSample: carClassesList
      .map(({ multiplier }) => numberFormat.format(calculatePrice(pkg.basePrice, multiplier)))
      .reduce((longest, price) => price.length > longest.length ? price : longest, ''),
  }));

  return (
    <section id="pricing" className="cinema-container pricing-calculator" aria-label="Тарифи та калькулятор вартості">
      <fieldset id="car-class" className="pricing-classes" tabIndex={-1}>
        <legend>Клас автомобіля</legend>
        <div className="pricing-classes__layout">
          <div className="pricing-classes__options" style={{ '--class-count': carClassesList.length }}>
            <span
              className="pricing-classes__indicator"
              aria-hidden="true"
              style={{ '--indicator-offset': indicatorOffset }}
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
        {packages.map(({ title, amount }) => `${title} — ${numberFormat.format(amount)} грн`).join('. ')}
      </p>
      <div className="pricing-comparison">
        {packages.map((pkg, index) => (
          <article
            key={pkg.id}
            aria-labelledby={`package-title-${index}`}
            className="pricing-plan"
            data-featured={pkg.featured}
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
                <PackagePrice amount={pkg.amount} widthSample={pkg.widthSample} reduceMotion={reduceMotion} />
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
          </article>
        ))}
      </div>
    </section>
  );
}
