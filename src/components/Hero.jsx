import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRightIcon } from './Icons';
import heroPhoto from '../assets/premiumwash/hero-alternative.webp';
import './Hero.css';

const ease = [0.16, 1, 0.3, 1];

const directions = [
  { target: '#poliruvannia', label: 'Полірування кузова' },
  { target: '#pokryttia', label: 'Захисні покриття' },
  { target: '#salon', label: 'Догляд за салоном' },
];

const intro = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.065 } },
};

const introItem = {
  hidden: { opacity: 0.65, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.48, ease } },
};

const titleLine = {
  hidden: { opacity: 0.25, y: '55%', clipPath: 'inset(0 0 45% 0)' },
  visible: { opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0)', transition: { duration: 0.57, ease } },
};

const scene = {
  hidden: { opacity: 0.5, clipPath: 'polygon(0 0, 93% 0, 74% 100%, 0 100%)' },
  visible: { opacity: 1, clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)', transition: { duration: 0.68, ease } },
};

export default function Hero() {
  const reduceMotion = useReducedMotion();
  const [sceneReady, setSceneReady] = useState(false);

  return (
    <section className="hero" aria-labelledby="hero-title">
      <motion.div
        className="hero__scene"
        variants={scene}
        initial={reduceMotion ? false : 'hidden'}
        animate={sceneReady && !reduceMotion ? 'visible' : undefined}
      >
        <img
          className="hero__image"
          src={heroPhoto}
          alt="Чорний Porsche у дітейлінг-боксі"
          width="1672"
          height="941"
          fetchPriority="high"
          onLoad={() => setSceneReady(true)}
        />
      </motion.div>

      <div className="cinema-container hero__layout">
        <motion.div
          className="hero__intro"
          variants={intro}
          initial={reduceMotion ? false : 'hidden'}
          animate="visible"
        >
          <motion.p className="cinema-label hero__kicker" variants={introItem}>
            <span aria-hidden="true">01 /</span> Студія дітейлінгу
          </motion.p>
          <h1 id="hero-title">
            <motion.span className="hero__line" variants={titleLine}>
              <span>Догляд,</span>
            </motion.span>{' '}
            <motion.span className="hero__line hero__line--accent" variants={titleLine}>
              <span>який видно</span>
              <i className="hero__slash" aria-hidden="true" />
            </motion.span>
          </h1>
          <motion.p className="hero__description" variants={introItem}>
            Комплексний дітейлінг, захист покриття та догляд за салоном у студійному форматі.
          </motion.p>
          <motion.div className="hero__actions" variants={introItem}>
            <Link to="/booking" className="btn-platinum cinema-button hero__primary">
              Записатися на дітейлінг
              <ArrowRightIcon size={18} className="cinema-arrow cinema-arrow--diagonal" />
            </Link>
            <Link to="/pricing" className="hero__secondary">
              Розрахувати вартість
            </Link>
          </motion.div>
        </motion.div>

        <nav className="hero__directions" aria-label="Напрями догляду">
          <ol className="hero__directions-list">
            {directions.map(({ target, label }, index) => (
              <li key={target}>
                <a href={target}>
                  <span className="hero__direction-number" aria-hidden="true">0{index + 2} /</span>
                  <span>{label}</span>
                </a>
              </li>
            ))}
          </ol>
          <Link className="hero__all-directions" to="/services" aria-label="Усі послуги">
            <ArrowRightIcon size={26} className="cinema-arrow" />
          </Link>
        </nav>
      </div>
    </section>
  );
}
