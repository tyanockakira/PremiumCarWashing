import { motion } from 'motion/react';
import Services from '../components/Services';
import { DetailHero, DetailReveal } from '../components/DetailPageParts';
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
        desktopPhoto={rearPhoto}
      />

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
    </div>
  );
}
