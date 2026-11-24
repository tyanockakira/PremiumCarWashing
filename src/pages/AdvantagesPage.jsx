import { useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon } from '../components/Icons';
import './AdvantagesPage.css';

const inspectionPhoto = 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80';
const paintPhoto = 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&w=800&q=80';

const exteriorCare = [
  { title: 'Підготовка поверхні', description: 'Після миття з кузова видаляють бітум і металеві вкраплення. На чистому лаку легше оцінити стан покриття.' },
  { title: 'Полірування', description: 'Пасту та круг підбирають під стан лаку. Спочатку перевіряють результат на невеликій ділянці.' },
  { title: 'Захисні покриття', description: 'Покриття наносять на підготовлену поверхню. Склад і спосіб нанесення підбирають за матеріалом та потребами авто.' },
];

const equipment = [
  { brand: 'Rupes', purpose: 'Полірувальне обладнання' },
  { brand: 'Gyeon', purpose: 'Захисні покриття' },
  { brand: 'Koch Chemie', purpose: 'Автомобільна хімія' },
  { brand: 'Scangrip', purpose: 'Інспекційне освітлення' },
  { brand: 'LeTech', purpose: 'Догляд за шкірою' },
];

const viewport = { once: true, amount: 0.15 };
const sequence = { visible: { transition: { staggerChildren: 0.07 } } };
const reveal = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.16, 1, 0.3, 1] } },
};
const revealItem = { variants: reveal, 'data-advantages-reveal': '' };

function DetailPhoto({ src, alt, caption, variant, priority = false }) {
  const frame = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const inView = useInView(frame, viewport);

  return (
    <figure className={`advantages-photo advantages-photo--${variant}`}>
      <div ref={frame} className="advantages-photo__frame" data-reveal-photo={loaded && inView}>
        <img
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : undefined}
          onLoad={() => setLoaded(true)}
        />
      </div>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

export default function AdvantagesPage() {
  const reduceMotion = useReducedMotion();
  const onScroll = reduceMotion
    ? { initial: false }
    : { initial: 'hidden', whileInView: 'visible', viewport };

  return (
    <div className="advantages-editorial">
      <section className="container advantages-intro" aria-labelledby="advantages-title">
        <motion.div
          className="advantages-intro__copy"
          variants={sequence}
          initial={reduceMotion ? false : 'hidden'}
          animate="visible"
        >
          <motion.h1 id="advantages-title" {...revealItem}>Точність у кожній деталі</motion.h1>
          <motion.p {...revealItem}>Обладнання, матеріали та контроль якості</motion.p>
        </motion.div>
        <DetailPhoto
          src={inspectionPhoto}
          alt="Фронтальний вигляд темного автомобіля з відблисками на кузові"
          caption="Ілюстративне фото · відблиски на темному кузові"
          variant="intro"
          priority
        />
      </section>

      <section className="advantages-quality" aria-labelledby="advantages-quality-title">
        <div className="container advantages-quality__layout">
          <motion.div className="advantages-quality__copy" variants={sequence} {...onScroll}>
            <motion.h2 id="advantages-quality-title" {...revealItem}>Контроль якості</motion.h2>
            <motion.p className="advantages-quality__lead" {...revealItem}>
              Інспекційне світло виявляє дрібні подряпини, голограми та сліди полірування на лаку.
            </motion.p>
            <motion.p {...revealItem}>
              Світло спрямовують під різними кутами. До роботи так визначають ділянки, що потребують уваги, а після полірування перевіряють рівномірність результату.
            </motion.p>
          </motion.div>
          <DetailPhoto
            src={paintPhoto}
            alt="Відблиски на капоті та фарі автомобіля"
            caption="Ілюстративне фото · відбиття світла на лаку"
            variant="paint"
          />
        </div>
      </section>

      <section className="container advantages-care" aria-labelledby="advantages-care-title">
        <motion.h2 id="advantages-care-title" {...revealItem} {...onScroll}>Технології догляду</motion.h2>
        <div className="advantages-care__layout">
          <div className="advantages-care__body">
            <h3>Кузов</h3>
            <motion.ul className="advantages-care__list" variants={sequence} {...onScroll}>
              {exteriorCare.map(({ title, description }) => (
                <motion.li key={title} {...revealItem}>
                  <h4>{title}</h4>
                  <p>{description}</p>
                </motion.li>
              ))}
            </motion.ul>
          </div>
          <motion.div className="advantages-care__interior" {...revealItem} {...onScroll}>
            <h3>Салон</h3>
            <p>Для шкіри, текстилю й пластику підбирають окремі засоби. Делікатні поверхні спершу перевіряють на непомітній ділянці.</p>
          </motion.div>
        </div>
      </section>

      <section className="advantages-equipment" aria-labelledby="advantages-equipment-title">
        <div className="container advantages-equipment__layout">
          <motion.div variants={sequence} {...onScroll}>
            <motion.h2 id="advantages-equipment-title" {...revealItem}>Обладнання та матеріали</motion.h2>
            <motion.p {...revealItem}>Приклади брендів і засобів для різних етапів дітейлінгу.</motion.p>
          </motion.div>
          <motion.ol className="advantages-equipment__list" variants={sequence} {...onScroll}>
            {equipment.map(({ brand, purpose }) => (
              <motion.li key={brand} {...revealItem}>
                <span className="advantages-equipment__brand">{brand}</span>
                <span className="advantages-equipment__purpose">{purpose}</span>
              </motion.li>
            ))}
          </motion.ol>
        </div>
      </section>

      <section className="container advantages-next" aria-labelledby="advantages-next-title">
        <motion.h2 id="advantages-next-title" {...revealItem} {...onScroll}>Оберіть догляд для свого авто</motion.h2>
        <div className="advantages-next__links">
          <Link to="/services" className="advantages-next__secondary">Переглянути послуги <ArrowRightIcon /></Link>
          <Link to="/booking" className="btn-platinum">Записатися на дітейлінг <ArrowRightIcon /></Link>
        </div>
      </section>
    </div>
  );
}
