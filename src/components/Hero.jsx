import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRightIcon, ShieldCheckIcon, SparkleIcon } from './Icons';
import './Hero.css';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1]
    }
  }
};

export default function Hero() {
  return (
    <section id="hero" className="hero-section">
      <div className="hero-grid-pattern"></div>

      <div className="container hero-container">
        <motion.div
          className="hero-content"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Status Badge */}
          <motion.div variants={itemVariants} className="hero-badge">
            <span className="badge-pulse"></span>
            <span className="badge-text">ПРЕМІАЛЬНИЙ ДЕТЕЙЛІНГ • ДЕМО-ВІТРИНА</span>
          </motion.div>

          {/* Main Title */}
          <motion.h1 variants={itemVariants} className="hero-title">
            Мистецтво блиску <br />
            та <span className="platinum-text">абсолютний захист</span> <br />
            вашого автомобіля
          </motion.h1>

          {/* Subtitle */}
          <motion.p variants={itemVariants} className="hero-description">
            Багатоетапне відновлювальне полірування, нанокерамічні покриття 9H Pro та
            делікатний догляд за інтер&apos;єром представницького й спортивного класу.
          </motion.p>

          {/* Action CTAs */}
          <motion.div variants={itemVariants} className="hero-actions">
            <Link to="/booking" className="btn-platinum hero-btn">
              <span>Записатися на дітейлінг</span>
              <span className="btn-arrow">
                <ArrowRightIcon size={16} />
              </span>
            </Link>

            <Link to="/pricing" className="btn-outline hero-btn">
              <span>Розрахувати вартість</span>
            </Link>
          </motion.div>

          {/* Key Metrics / Highlights */}
          <motion.div variants={itemVariants} className="hero-stats">
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
          </motion.div>
        </motion.div>

        {/* Visual Showcase: Luxury Car */}
        <motion.div
          className="hero-visual"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="car-frame">
            <img
              src="https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1600&q=85"
              alt="Ексклюзивний спорткар після дітейлінгу"
              className="car-image"
              loading="eager"
            />

            {/* Floating Quality Badges */}
            <motion.div
              className="floating-badge floating-badge--top"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
            >
              <div className="floating-badge__icon">
                <ShieldCheckIcon size={18} />
              </div>
              <div>
                <span className="floating-badge__title">Кераміка 9H Pro</span>
                <span className="floating-badge__desc">Гідрофобний ефект до 36 міс</span>
              </div>
            </motion.div>

            <motion.div
              className="floating-badge floating-badge--bottom"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.55 }}
            >
              <div className="floating-badge__icon">
                <SparkleIcon size={18} />
              </div>
              <div>
                <span className="floating-badge__title">Глянцевий блиск 100%</span>
                <span className="floating-badge__desc">Усунення рисок та голограм</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
