import { Link } from 'react-router-dom';
import './Hero.css';

export default function Hero() {
  return (
    <section id="hero" className="hero-section">
      {/* Background Ambience & Lighting */}
      <div className="hero-glow hero-glow--top"></div>
      <div className="hero-glow hero-glow--right"></div>
      <div className="hero-grid-pattern"></div>

      <div className="container hero-container">
        <div className="hero-content">
          {/* Status Badge */}
          <div className="hero-badge">
            <span className="badge-pulse"></span>
            <span className="badge-text">ПРЕМІАЛЬНИЙ ДЕТЕЙЛІНГ • ДЕМО-ВІТРИНА</span>
          </div>

          {/* Main Title */}
          <h1 className="hero-title">
            Мистецтво блиску <br />
            та <span className="platinum-text">абсолютний захист</span> <br />
            вашого автомобіля
          </h1>

          {/* Subtitle */}
          <p className="hero-description">
            Багатоетапне відновлювальне полірування, нанокерамічні покриття 9H Pro та
            делікатний догляд за інтер&apos;єром представницького й спортивного класу.
          </p>

          {/* Action CTAs */}
          <div className="hero-actions">
            <Link to="/booking" className="btn-platinum hero-btn">
              <span>Записатися на дітейлінг</span>
              <span className="btn-arrow">→</span>
            </Link>

            <Link to="/pricing" className="btn-outline hero-btn">
              <span>Розрахувати вартість</span>
            </Link>
          </div>

          {/* Key Metrics / Highlights */}
          <div className="hero-stats">
            <div className="stat-card">
              <span className="stat-number platinum-text">9+</span>
              <span className="stat-label">Років досвіду майстрів</span>
            </div>
            <div className="stat-divider"></div>

            <div className="stat-card">
              <span className="stat-number platinum-text">3 800+</span>
              <span className="stat-label">Обслугованих спорткарів та SUV</span>
            </div>
            <div className="stat-divider"></div>

            <div className="stat-card">
              <span className="stat-number platinum-text">100%</span>
              <span className="stat-label">Контроль якості кожного етапу</span>
            </div>
          </div>
        </div>

        {/* Visual Showcase: Luxury Car */}
        <div className="hero-visual">
          <div className="car-frame">
            <div className="car-glow-ring"></div>
            <img
              src="https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1600&q=85"
              alt="Ексклюзивний спорткар після дітейлінгу"
              className="car-image"
              loading="eager"
            />

            {/* Floating Quality Badge */}
            <div className="floating-badge floating-badge--top">
              <span className="floating-badge__icon">✦</span>
              <div>
                <span className="floating-badge__title">Кераміка 9H Pro</span>
                <span className="floating-badge__desc">Гідрофобний ефект до 36 міс</span>
              </div>
            </div>

            <div className="floating-badge floating-badge--bottom">
              <span className="floating-badge__icon">⭐</span>
              <div>
                <span className="floating-badge__title">Глянцевий блиск 100%</span>
                <span className="floating-badge__desc">Усунення рисок та голограм</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
