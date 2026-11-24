import { motion, useReducedMotion } from 'motion/react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import { ArrowRightIcon, CalendarIcon, GemIcon, ShieldCheckIcon } from '../components/Icons';
import polishingPhoto from '../assets/premiumwash/polishing.webp';
import ceramicPhoto from '../assets/premiumwash/ceramic.webp';
import interiorPhoto from '../assets/premiumwash/interior.webp';
import filmPhoto from '../assets/premiumwash/ppf.webp';
import './HomePage.css';

const directions = [
  {
    id: 'poliruvannia',
    title: 'Полірування кузова',
    description: 'Корекція дрібних дефектів лаку та відновлення блиску.',
    image: polishingPhoto,
    width: 1671,
    height: 941,
  },
  {
    id: 'pokryttia',
    title: 'Захисні покриття',
    description: 'Керамічні покриття для догляду за лаком.',
    image: ceramicPhoto,
    width: 1672,
    height: 940,
  },
  {
    id: 'salon',
    title: 'Догляд за салоном',
    description: 'Очищення шкіри, текстилю та пластику.',
    image: interiorPhoto,
    width: 1672,
    height: 941,
  },
  {
    id: 'plivka',
    title: 'Обклеювання PPF',
    description: 'Прозора плівка для захисту кузова від дрібних пошкоджень.',
    image: filmPhoto,
    width: 1672,
    height: 941,
  },
];

const approach = [
  { Icon: GemIcon, title: 'Матеріали', description: 'Окремі засоби для лаку, шкіри й текстилю' },
  { Icon: ShieldCheckIcon, title: 'Контроль якості', description: 'Огляд покриття під інспекційним світлом' },
  { Icon: CalendarIcon, title: 'Онлайн-запис', description: 'Вибір послуги, дати й часу' },
];

export default function HomePage() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="home-page">
      <Hero />

      <section className="cinema-container home-directions" aria-labelledby="home-directions-title">
        <div className="home-directions__intro">
          <p className="cinema-label">Напрями робіт</p>
          <h2 id="home-directions-title" className="cinema-heading">Комплексний<br />{' '}догляд за авто</h2>
          <p className="home-directions__description">Від відновлення блиску до захисту кузова й догляду за салоном.</p>
          <Link to="/services" className="btn-outline cinema-button">
            Усі послуги <ArrowRightIcon size={16} className="cinema-arrow cinema-arrow--diagonal" />
          </Link>
        </div>

        <ol className="home-reel">
          {directions.map(({ id, title, description, image, width, height }, index) => (
            <li id={id} key={id} className="home-reel__item">
              <Link to="/services" className="home-reel__link">
                <div className="home-reel__frame">
                  <motion.div
                    className="home-reel__media"
                    initial={reduceMotion ? false : {
                      opacity: 0.55,
                      clipPath: 'polygon(0 0, 66% 0, 52% 100%, 0 100%)',
                    }}
                    whileInView={{ opacity: 1, clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }}
                    viewport={{ once: true, amount: 0.18 }}
                    transition={{ duration: reduceMotion ? 0 : 0.5, delay: reduceMotion ? 0 : index * 0.045, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <img src={image} alt="" width={width} height={height} loading="lazy" />
                  </motion.div>
                </div>
                <div className="home-reel__caption">
                  <span className="home-reel__number" aria-hidden="true">0{index + 1}</span>
                  <span>
                    <span className="home-reel__title">{title}</span>
                    <span className="home-reel__description">{description}</span>
                  </span>
                  <ArrowRightIcon size={20} className="cinema-arrow home-reel__arrow" />
                </div>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="cinema-container home-approach" aria-labelledby="home-approach-title">
        <div className="home-approach__intro">
          <p className="cinema-label">Переваги</p>
          <h2 id="home-approach-title" className="cinema-heading">
            <Link to="/advantages">
              Наш підхід до догляду <ArrowRightIcon size={18} className="cinema-arrow cinema-arrow--diagonal" />
            </Link>
          </h2>
        </div>
        <ul className="home-approach__list">
          {approach.map(({ Icon, title, description }) => (
            <li key={title}>
              <Icon size={24} />
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="home-booking" aria-labelledby="home-booking-title">
        <div className="cinema-container home-booking__layout">
          <div>
            <p className="cinema-label">Онлайн-запис</p>
            <h2 id="home-booking-title" className="cinema-heading">Оберіть догляд для свого авто</h2>
          </div>
          <Link to="/booking" className="btn-platinum cinema-button">
            <CalendarIcon size={18} /> Записатися
            <ArrowRightIcon size={16} className="cinema-arrow cinema-arrow--diagonal" />
          </Link>
        </div>
        <img className="home-booking__photo" src={ceramicPhoto} alt="" loading="lazy" width="1672" height="940" />
      </section>
    </div>
  );
}
