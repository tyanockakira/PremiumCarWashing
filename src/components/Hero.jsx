import { Link } from 'react-router-dom';
import { ArrowRightIcon } from './Icons';
import heroPhoto from '../assets/premiumwash/hero-alternative.webp';
import './Hero.css';

export default function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="cinema-container hero__layout">
        <div className="hero__intro">
          <h1 id="hero-title">
            <span className="hero__line-mask">
              <span className="hero__line"><span>Догляд,</span></span>
            </span>{' '}
            <span className="hero__line-mask">
              <span className="hero__line hero__line--accent">
                <span>який видно</span>
                <i className="hero__slash" aria-hidden="true" />
              </span>
            </span>
          </h1>
          <p className="hero__description">Дітейлінг кузова й салону в студійному форматі.</p>
          <div className="hero__actions">
            <Link to="/booking" className="btn-platinum cinema-button hero__primary">
              Записатися на дітейлінг
              <ArrowRightIcon size={18} className="cinema-arrow cinema-arrow--diagonal" />
            </Link>
          </div>
        </div>
        <div className="hero__scene">
          <img
            className="hero__image"
            src={heroPhoto}
            alt="Чорний Porsche у дітейлінг-боксі"
            width="1672"
            height="941"
            fetchPriority="high"
          />
        </div>
      </div>
    </section>
  );
}
