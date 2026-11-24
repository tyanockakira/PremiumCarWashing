import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import { ArrowRightIcon } from '../components/Icons';
import { useDetailReducedMotion } from '../components/useDetailReducedMotion';
import { photoWipe } from '../lib/motion';
import polishingPhoto from '../assets/premiumwash/polishing.webp';
import ceramicPhoto from '../assets/premiumwash/ceramic.webp';
import interiorPhoto from '../assets/premiumwash/interior.webp';
import filmPhoto from '../assets/premiumwash/ppf.webp';
import './HomePage.css';

const directions = [
  { title: 'Полірування кузова', image: polishingPhoto, width: 1671, height: 941 },
  { title: 'Захисні покриття', image: ceramicPhoto, width: 1672, height: 940 },
  { title: 'Догляд за салоном', image: interiorPhoto, width: 1672, height: 941 },
  { title: 'Обклеювання PPF', image: filmPhoto, width: 1672, height: 941 },
];

export default function HomePage() {
  const reduceMotion = useDetailReducedMotion();

  return (
    <div className="home-page">
      <Hero />

      <section className="cinema-container home-directions" aria-labelledby="home-directions-title">
        <div className="home-directions__header">
          <h2 id="home-directions-title" className="cinema-heading">Послуги</h2>
          <Link to="/services" className="home-section-link">
            Усі послуги <ArrowRightIcon size={16} className="cinema-arrow cinema-arrow--diagonal" />
          </Link>
        </div>

        <ul className="home-reel">
          {directions.map(({ title, image, width, height }, index) => (
            <li key={title}>
              <div className="home-reel__frame">
                <motion.div
                  className="home-reel__media"
                  data-photo-reveal
                  variants={photoWipe('left', index * 0.055)}
                  initial={reduceMotion ? false : 'hidden'}
                  whileInView={reduceMotion ? undefined : 'visible'}
                  viewport={{ once: true, amount: 0.18 }}
                >
                  <img src={image} alt="" width={width} height={height} loading="lazy" />
                </motion.div>
              </div>
              <h3>{title}</h3>
            </li>
          ))}
        </ul>
      </section>

      <section className="cinema-container home-approach" aria-labelledby="home-approach-title">
        <div>
          <h2 id="home-approach-title" className="cinema-heading">Наш підхід</h2>
          <p>Підбираємо засоби для кожної поверхні й перевіряємо покриття під інспекційним світлом.</p>
        </div>
        <Link to="/advantages" className="home-section-link">
          Докладніше про підхід <ArrowRightIcon size={16} className="cinema-arrow cinema-arrow--diagonal" />
        </Link>
      </section>
    </div>
  );
}
