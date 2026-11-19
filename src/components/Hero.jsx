import './Hero.css';

export default function Hero({ onOpenBooking }) {
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
            <span className="badge-text">ПРЕМИАЛЬНЫЙ ДЕТЕЙЛИНГ В МОСКВЕ</span>
          </div>

          {/* Main Title */}
          <h1 className="hero-title">
            Искусство блеска <br />
            и <span className="gold-text">абсолютная защита</span> <br />
            вашего автомобиля
          </h1>

          {/* Subtitle */}
          <p className="hero-description">
            Восстановительная многоэтапная полировка, керамические составы 9H+ и 
            детальный уход за интерьером представительского и спортивного класса.
          </p>

          {/* Action CTAs */}
          <div className="hero-actions">
            <button 
              type="button" 
              className="btn-gold hero-btn"
              onClick={onOpenBooking}
            >
              <span>Записаться на детейлинг</span>
              <span className="btn-arrow">→</span>
            </button>

            <a href="#pricing" className="btn-outline hero-btn">
              <span>Рассчитать стоимость</span>
            </a>
          </div>

          {/* Key Metrics / Highlights */}
          <div className="hero-stats">
            <div className="stat-card">
              <span className="stat-number gold-text">9+</span>
              <span className="stat-label">Лет на рынке детейлинга</span>
            </div>
            <div className="stat-divider"></div>

            <div className="stat-card">
              <span className="stat-number gold-text">3 800+</span>
              <span className="stat-label">Обработанных спорткаров и SUV</span>
            </div>
            <div className="stat-divider"></div>

            <div className="stat-card">
              <span className="stat-number gold-text">100%</span>
              <span className="stat-label">Гарантия на стойкость покрытия</span>
            </div>
          </div>
        </div>

        {/* Visual Showcase: Luxury Car */}
        <div className="hero-visual">
          <div className="car-frame">
            <div className="car-glow-ring"></div>
            <img 
              src="https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1600&q=85" 
              alt="Эксклюзивный спорткар после детейлинга"
              className="car-image"
              loading="eager"
            />
            
            {/* Floating Quality Badge */}
            <div className="floating-badge floating-badge--top">
              <span className="floating-badge__icon">💎</span>
              <div>
                <span className="floating-badge__title">Керамика 9H Pro</span>
                <span className="floating-badge__desc">Гидрофобный эффект до 36 мес</span>
              </div>
            </div>

            <div className="floating-badge floating-badge--bottom">
              <span className="floating-badge__icon">⭐</span>
              <div>
                <span className="floating-badge__title">Глянцевый блеск 100%</span>
                <span className="floating-badge__desc">Устранение голограмм и рисок</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
