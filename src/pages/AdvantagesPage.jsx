import { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { DetailHero } from '../components/DetailPageParts';
import { useDetailReducedMotion } from '../components/useDetailReducedMotion';
import { easeOut, photoWipe } from '../lib/motion';
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

const editorialPhoto = {
  left: photoWipe(),
  right: photoWipe('right'),
  bottom: photoWipe('bottom'),
};

const editorialCopy = {
  hidden: { opacity: 0.65 },
  visible: { opacity: 1, transition: { duration: 0.42, delay: 0.12, ease: easeOut } },
};

function ApproachPhoto({ photo, alt, from }) {
  return (
    <div className="advantages-frame">
      <motion.div
        className="advantages-frame__reveal"
        data-photo-reveal
        variants={editorialPhoto[from]}
      >
        <img src={photo} alt={alt} loading="lazy" width={1672} height={941} />
      </motion.div>
    </div>
  );
}

export default function AdvantagesPage() {
  const reduceMotion = useDetailReducedMotion();
  const equipmentList = useRef(null);
  const showEquipment = useInView(equipmentList, { once: true, amount: 'some' });
  const entrance = {
    initial: reduceMotion ? false : 'hidden',
    whileInView: reduceMotion ? undefined : 'visible',
    viewport: { once: true, amount: 0.18 },
  };

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
            <motion.article className="advantages-approach" key={title} {...entrance}>
              <ApproachPhoto photo={photo} alt={alt} from={index % 2 ? 'right' : 'left'} />
              <motion.div className="advantages-approach__copy" variants={editorialCopy}>
                <div>
                  <span className="advantages-approach__number" aria-hidden="true">0{index + 1}</span>
                  <h2>{title}</h2>
                </div>
                <p>{description}</p>
              </motion.div>
            </motion.article>
          ))}
        </div>
      </section>

      <motion.section className="cinema-container advantages-inspection" aria-labelledby="advantages-quality-title" {...entrance}>
        <motion.div className="advantages-inspection__copy" variants={editorialCopy}>
          <h2 id="advantages-quality-title" className="cinema-heading">Контроль якості</h2>
          <p>
            Інспекційне світло під різними кутами допомагає помітити дрібні подряпини, голограми й залишки пасти.
          </p>
          <p>
            До полірування оглядають стан лаку. Після обробки перевіряють рівномірність поверхні та складні ділянки біля країв.
          </p>
        </motion.div>
        <ApproachPhoto photo={inspectionPhoto} alt="Майстер оглядає лак під ручною інспекційною лампою" from="bottom" />
      </motion.section>

      <section className="cinema-container advantages-equipment" aria-labelledby="advantages-equipment-title">
        <div>
          <h2 id="advantages-equipment-title" className="cinema-heading">Обладнання та матеріали</h2>
          <p>Приклади для різних етапів дітейлінгу.</p>
        </div>
        <dl className="advantages-equipment__list" ref={equipmentList} data-revealed={showEquipment}>
          {equipment.map(([brand, purpose], index) => (
            <div key={brand} className="advantages-equipment__item" style={{ '--equipment-index': index }}>
              <dt>{brand}</dt>
              <dd>{purpose}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
