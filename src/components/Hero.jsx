import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon } from './Icons';
import './Hero.css';

const heroPhoto = 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1600&q=85';

export default function Hero() {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <section id="hero" className="hero" aria-labelledby="hero-title">
      <div className="container layout-grid hero__layout">
        <div className="hero__intro">
          <h1 id="hero-title">Дітейлінг і захист автомобіля</h1>
          <p className="hero__description">
            Полірування кузова, захисні покриття та догляд за салоном.
          </p>
          <div className="hero__actions">
            <Link to="/booking" className="btn-platinum hero__primary">
              Записатися на дітейлінг <ArrowRightIcon />
            </Link>
            <Link to="/pricing" className="hero__secondary">
              Розрахувати вартість
            </Link>
          </div>
        </div>

        <figure className="hero__photo">
          <div className="hero__frame" data-loaded={imageLoaded}>
            <img
              src={heroPhoto}
              alt="Темний автомобіль біля причалу"
              className="hero__image"
              fetchPriority="high"
              onLoad={() => setImageLoaded(true)}
            />
          </div>
          <figcaption>Кузов автомобіля зблизька</figcaption>
        </figure>
      </div>
    </section>
  );
}
