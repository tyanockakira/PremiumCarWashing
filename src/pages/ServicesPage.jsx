import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import Services from '../components/Services';
import { DetailHero, DetailReveal } from '../components/DetailPageParts';
import { ArrowRightIcon } from '../components/Icons';
import rearPhoto from '../assets/premiumwash/contacts-rear.webp';

const processSteps = [
  {
    title: 'Огляд покриття',
    description: 'Вимірюємо товщину лаку та визначаємо ділянки, які потребують корекції.',
  },
  {
    title: 'Миття й підготовка',
    description: 'Миємо кузов у три фази, видаляємо бітум, гальмівний пил і смоли.',
  },
  {
    title: 'Полірування',
    description: 'Коригуємо дрібні подряпини й голограми, добираючи пасти та круги під стан лаку.',
  },
  {
    title: 'Нанесення захисту',
    description: 'Наносимо керамічне покриття або обклеюємо кузов плівкою PPF.',
  },
  {
    title: 'Фінальна інспекція',
    description: 'Перевіряємо покриття під інспекційним світлом.',
  },
];

export default function ServicesPage() {
  return (
    <div className="services-page detail-page">
      <DetailHero
        number="02"
        label="Наші послуги"
        lines={['Послуги', 'дітейлінгу']}
        description="Полірування й захист кузова, хімчистка та догляд за салоном."
        photo={rearPhoto}
      >
        <div className="detail-hero__actions">
          <Link to="/booking" className="btn-platinum cinema-button">
            Записатися на догляд <ArrowRightIcon size={16} className="cinema-arrow cinema-arrow--diagonal" />
          </Link>
          <Link to="/pricing" className="btn-outline cinema-button">Розрахувати вартість</Link>
        </div>
      </DetailHero>

      <Services />

      <section className="cinema-container service-process detail-section" aria-labelledby="process-heading">
        <DetailReveal>
          <h2 id="process-heading" className="cinema-heading detail-section__title">Як ми працюємо з кузовом</h2>
        </DetailReveal>
        <ol className="service-process__steps" role="list">
          {processSteps.map(({ title, description }, index) => (
            <DetailReveal as={motion.li} key={title} delay={index * 0.045}>
              <span className="service-process__number" aria-hidden="true">0{index + 1}</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </DetailReveal>
          ))}
        </ol>
      </section>

      <DetailReveal as={motion.section} className="cinema-container detail-cta" aria-labelledby="service-cta-heading">
        <div>
          <h2 id="service-cta-heading" className="cinema-heading detail-cta__title">Потрібна допомога з вибором?</h2>
          <p>Огляд покриття допоможе визначити, які роботи потрібні вашому авто.</p>
        </div>
        <Link to="/booking" className="btn-outline cinema-button">
          Записатися на огляд <ArrowRightIcon size={16} className="cinema-arrow cinema-arrow--diagonal" />
        </Link>
      </DetailReveal>
    </div>
  );
}
