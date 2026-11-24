import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { DetailHero, DetailReveal } from '../components/DetailPageParts';
import { ArrowRightIcon } from '../components/Icons';
import { useDetailReducedMotion } from '../components/useDetailReducedMotion';
import rearPhoto from '../assets/premiumwash/contacts-rear.webp';
import polishingPhoto from '../assets/premiumwash/polishing.webp';
import ceramicPhoto from '../assets/premiumwash/ceramic.webp';
import interiorPhoto from '../assets/premiumwash/interior.webp';
import filmPhoto from '../assets/premiumwash/ppf.webp';
import inspectionPhoto from '../assets/premiumwash/inspection.webp';
import './AdvantagesPage.css';

const approaches = [
  {
    title: 'Полірувальне обладнання',
    description: 'Пасту й круг підбирають за станом лаку. Перед поліруванням кузова комбінацію перевіряють на малій ділянці.',
    photo: polishingPhoto,
    alt: 'Полірувальна машинка на лакованій поверхні кузова',
  },
  {
    title: 'Керамічні покриття',
    description: 'Кузов очищають від бітуму й металевих вкраплень. Кераміку наносять на підготовлений лак.',
    photo: ceramicPhoto,
    alt: 'Краплі води на чорному лакофарбовому покритті',
  },
  {
    title: 'Догляд за салоном',
    description: 'Шкіра, текстиль і пластик потребують різних засобів. На делікатних поверхнях склад спершу перевіряють у непомітному місці.',
    photo: interiorPhoto,
    alt: 'Чорна шкіра салону з червоним прошиттям',
  },
  {
    title: 'Захисна плівка',
    description: 'Поліуретанову плівку підганяють за формою кузовних деталей. Особливу увагу приділяють краям та вигинам.',
    photo: filmPhoto,
    alt: 'Нанесення прозорої захисної плівки на кузов',
  },
];

const equipment = [
  ['Rupes', 'Полірувальні машинки'],
  ['Gyeon', 'Захисні покриття'],
  ['Koch Chemie', 'Засоби для очищення'],
  ['Scangrip', 'Інспекційне освітлення'],
  ['LeTech', 'Догляд за шкірою'],
];

const ease = [0.16, 1, 0.3, 1];

function ApproachPhoto({ photo, alt, delay = 0 }) {
  const reduceMotion = useDetailReducedMotion();

  return (
    <div className="advantages-frame">
      <motion.div
        className="advantages-frame__reveal"
        initial={reduceMotion ? false : { clipPath: 'polygon(0 0, 62% 0, 44% 100%, 0 100%)' }}
        whileInView={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: reduceMotion ? 0 : 0.78, delay: reduceMotion ? 0 : delay, ease }}
      >
        <img src={photo} alt={alt} loading="lazy" />
      </motion.div>
    </div>
  );
}

export default function AdvantagesPage() {
  return (
    <div className="detail-page advantages-editorial">
      <DetailHero
        number="04"
        label="Наш підхід"
        lines={['Чому обирають', 'PremiumWash']}
        description="Від підготовки поверхні до фінального огляду під інспекційним світлом."
        photo={rearPhoto}
      />

      <section className="advantages-approaches" aria-label="Технології дітейлінгу">
        <div className="cinema-container advantages-approaches__layout">
          {approaches.map(({ title, description, photo, alt }, index) => (
            <article className="advantages-approach" key={title}>
              <ApproachPhoto photo={photo} alt={alt} delay={(index % 2) * 0.08} />
              <div className="advantages-approach__copy">
                <DetailReveal delay={(index % 2) * 0.08}>
                  <span className="advantages-approach__number" aria-hidden="true">0{index + 1}</span>
                  <h2>{title}</h2>
                </DetailReveal>
                <DetailReveal as={motion.p} delay={0.08 + (index % 2) * 0.08}>{description}</DetailReveal>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="cinema-container advantages-inspection" aria-labelledby="advantages-quality-title">
        <div className="advantages-inspection__copy">
          <DetailReveal>
            <h2 id="advantages-quality-title" className="cinema-heading">Контроль якості</h2>
          </DetailReveal>
          <DetailReveal as={motion.p} delay={0.08}>
            Інспекційне світло під різними кутами допомагає помітити дрібні подряпини, голограми й залишки пасти.
          </DetailReveal>
          <DetailReveal as={motion.p} delay={0.16}>
            До полірування оглядають стан лаку. Після обробки перевіряють рівномірність поверхні та складні ділянки біля країв.
          </DetailReveal>
        </div>
        <ApproachPhoto photo={inspectionPhoto} alt="Майстер оглядає лак під ручною інспекційною лампою" />
      </section>

      <section className="cinema-container advantages-equipment" aria-labelledby="advantages-equipment-title">
        <DetailReveal>
          <h2 id="advantages-equipment-title" className="cinema-heading">Обладнання та матеріали</h2>
          <p>Приклади для різних етапів дітейлінгу.</p>
        </DetailReveal>
        <dl className="advantages-equipment__list">
          {equipment.map(([brand, purpose], index) => (
            <DetailReveal key={brand} className="advantages-equipment__item" delay={index * 0.045}>
              <dt>{brand}</dt>
              <dd>{purpose}</dd>
            </DetailReveal>
          ))}
        </dl>
      </section>

      <DetailReveal as={motion.section} className="cinema-container advantages-next" aria-labelledby="advantages-next-title">
        <h2 id="advantages-next-title" className="cinema-heading">Оберіть догляд для свого авто</h2>
        <div className="advantages-next__links">
          <Link to="/services" className="advantages-next__secondary">
            Переглянути послуги <ArrowRightIcon size={16} className="cinema-arrow" />
          </Link>
          <Link to="/booking" className="btn-platinum cinema-button">
            Записатися <ArrowRightIcon size={16} className="cinema-arrow cinema-arrow--diagonal" />
          </Link>
        </div>
      </DetailReveal>
    </div>
  );
}
