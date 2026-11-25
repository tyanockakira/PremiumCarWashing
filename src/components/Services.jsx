import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { getServices } from '../api/bookingApi';
import { ArrowRightIcon, CheckIcon, ClockIcon } from './Icons';
import { DetailDisclosure } from './DetailPageParts';
import { useDetailReducedMotion } from './useDetailReducedMotion';
import { duration, easeOut, photoWipe } from '../lib/motion';
import polishingPhoto from '../assets/premiumwash/polishing.webp';
import ceramicPhoto from '../assets/premiumwash/ceramic.webp';
import interiorPhoto from '../assets/premiumwash/interior.webp';
import ppfPhoto from '../assets/premiumwash/ppf.webp';
import { getResponsiveImage } from '../data/responsiveImages';
import './Services.css';

const numberFormat = new Intl.NumberFormat('uk-UA');
const servicePhoto = photoWipe('left', 0.055);
const titleReveal = {
  hidden: { y: '105%' },
  visible: { y: 0, transition: { duration: duration.selector, ease: easeOut } },
};

const directions = {
  polishing: {
    title: 'Полірування кузова',
    summary: 'Корекція дрібних дефектів лаку та відновлення глибини кольору й блиску.',
    photo: polishingPhoto,
  },
  ceramic: {
    title: 'Захисні покриття',
    summary: 'Багатошарове керамічне покриття з водовідштовхувальним ефектом.',
    photo: ceramicPhoto,
  },
  interior: {
    title: 'Догляд за салоном',
    summary: 'Хімчистка та догляд за шкірою, пластиком і текстилем.',
    photo: interiorPhoto,
  },
  ppf: {
    title: 'Обклеювання PPF',
    summary: 'Прозора поліуретанова плівка для захисту кузова від сколів і подряпин.',
    photo: ppfPhoto,
  },
};

const defaultServices = [
  {
    id: 'polishing',
    title: 'Відновлювальне полірування',
    basePrice: 8500,
    duration: '1–2 дні',
    description: 'Багатоетапна корекція подряпин, слідів від миття та окиснення з контролем товщини заводського лаку.',
    features: [
      'Корекція дрібних подряпин і рисок',
      'Пасти та полірувальні круги Rupes і Koch Chemie',
      'Контроль товщини лакофарбового покриття',
      'Фінішна антиголограмна обробка',
    ],
  },
  {
    id: 'ceramic',
    title: 'Нанокераміка 9H Pro',
    basePrice: 16000,
    duration: '2–3 дні',
    description: 'Нанесення багатошарового керамічного покриття Gyeon Quartz на підготовлений кузов.',
    features: [
      'Захист від реагентів, смол і бруду',
      'Водовідштовхувальне покриття',
      'Нанесення 2–4 шарів з інфрачервоним сушінням',
    ],
  },
  {
    id: 'interior',
    title: 'Преміум-хімчистка салону',
    basePrice: 7500,
    duration: '1–2 дні',
    description: 'Делікатне очищення поверхонь салону, озонування та догляд за шкірою.',
    features: [
      'Глибоке очищення шкіри, алькантари та текстилю',
      'Антибактеріальна обробка й озонування',
      'Догляд за шкірою засобами LeTech',
      'Очищення засобами без різкого запаху',
    ],
  },
  {
    id: 'ppf',
    title: 'Обклеювання поліуретаном PPF',
    basePrice: 32000,
    duration: '2–4 дні',
    description: 'Захист лаку плівками SunTek і Stek від гравію, сколів та дрібних пошкоджень.',
    features: [
      'Самовідновлення поверхні плівки під час нагрівання',
      'Товщина поліуретану до 220 мікронів',
      'Розкрій плівки за лекалами',
    ],
  },
];

function ServiceRow({ service, index, open, onToggle }) {
  const reduceMotion = useDetailReducedMotion();
  const direction = directions[service.id];
  const title = direction?.title ?? service.title;
  const panelId = `service-details-${index}`;

  return (
    <motion.li
      className="service-row"
      data-service={service.id}
      data-open={open}
      initial={reduceMotion ? false : 'hidden'}
      whileInView={reduceMotion ? undefined : 'visible'}
      viewport={{ once: true, amount: 'some' }}
    >
      <h2 className="service-row__heading">
        <button
          type="button"
          className="service-row__toggle"
          aria-expanded={open}
          aria-controls={panelId}
          aria-labelledby={`${panelId}-title`}
          aria-describedby={`${panelId}-summary ${panelId}-price`}
          onClick={onToggle}
        >
          <span className="service-row__number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
          <span className="service-row__intro">
            <span id={`${panelId}-title`} className="service-row__title">
              <motion.span variants={titleReveal}>{title}</motion.span>
            </span>
            <span id={`${panelId}-summary`} className="service-row__summary">{direction?.summary ?? service.description}</span>
            <span id={`${panelId}-price`} className="service-row__price">від {numberFormat.format(service.basePrice)} грн</span>
          </span>
          <span className="service-row__frame">
            <motion.span
              className="service-row__photo"
              data-photo-reveal
              variants={servicePhoto}
            >
              <img
                src={direction?.photo ?? polishingPhoto}
                srcSet={getResponsiveImage(direction?.photo ?? polishingPhoto)?.srcSet}
                sizes="(max-width: 767px) 100vw, (max-width: 1199px) 50vw, 520px"
                alt=""
                width={1672}
                height={941}
                loading="lazy"
              />
            </motion.span>
          </span>
          <ArrowRightIcon size={24} className="service-row__arrow" />
        </button>
      </h2>
      <DetailDisclosure id={panelId} open={open}>
        <div className="service-row__details">
          <div>
            <h3>{service.title}</h3>
            {service.description && <p>{service.description}</p>}
            {service.duration && (
              <p className="service-row__duration"><ClockIcon size={16} /> {service.duration}</p>
            )}
          </div>
          {service.features.length > 0 && (
            <ul className="detail-checklist">
              {service.features.map((feature, index) => (
                <li key={index}><CheckIcon size={16} /><span>{feature}</span></li>
              ))}
            </ul>
          )}
          <Link
            to="/booking"
            state={{ service: service.title }}
            className="btn-platinum cinema-button"
          >
            Записатися <ArrowRightIcon size={16} className="cinema-arrow cinema-arrow--diagonal" />
          </Link>
        </div>
      </DetailDisclosure>
    </motion.li>
  );
}

export default function Services() {
  const [services, setServices] = useState(defaultServices);
  const [openService, setOpenService] = useState(null);

  useEffect(() => {
    let active = true;
    getServices().then((data) => {
      if (active && data?.length) {
        setServices(data.map((item) => ({
          id: item.slug || item.id,
          title: item.title,
          basePrice: item.base_price,
          duration: item.duration_text,
          description: item.description,
          features: item.features || [],
        })));
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="cinema-container service-catalog" aria-label="Каталог послуг">
      <ol className="service-catalog__list" role="list">
        {services.map((service, index) => (
          <ServiceRow
            key={service.id}
            service={service}
            index={index}
            open={openService === service.id}
            onToggle={() => setOpenService((current) => current === service.id ? null : service.id)}
          />
        ))}
      </ol>
    </section>
  );
}
