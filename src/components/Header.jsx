import { useState, useEffect } from 'react';
import './Header.css';

export default function Header({ onOpenBooking }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className={`header ${scrolled ? 'header--scrolled' : ''}`}>
      <div className="container header__container">
        {/* Brand Logo */}
        <a href="#hero" className="header__logo" onClick={closeMobileMenu}>
          <div className="logo-emblem">
            <span className="logo-symbol">✦</span>
          </div>
          <div className="logo-text">
            <span className="logo-brand">PREMIUM<span className="logo-gold">WASH</span></span>
            <span className="logo-sub">DETAILING STUDIO</span>
          </div>
        </a>

        {/* Desktop Navigation */}
        <nav className="header__nav">
          <ul className="nav__list">
            <li><a href="#hero" className="nav__link">Главная</a></li>
            <li><a href="#services" className="nav__link">Услуги</a></li>
            <li><a href="#pricing" className="nav__link">Цены</a></li>
            <li><a href="#advantages" className="nav__link">Преимущества</a></li>
            <li><a href="#contacts" className="nav__link">Контакты</a></li>
          </ul>
        </nav>

        {/* Action button & Phone */}
        <div className="header__actions">
          <a href="tel:+74959990088" className="header__phone">
            <span className="phone-icon">✆</span>
            <span className="phone-number">+7 (495) 999-00-88</span>
          </a>
          <button 
            type="button" 
            className="btn-gold header__cta"
            onClick={onOpenBooking}
          >
            Записаться
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <button 
          type="button"
          className={`hamburger ${mobileMenuOpen ? 'hamburger--active' : ''}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Открыть меню"
        >
          <span className="hamburger__line"></span>
          <span className="hamburger__line"></span>
          <span className="hamburger__line"></span>
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      <div className={`mobile-menu ${mobileMenuOpen ? 'mobile-menu--open' : ''}`}>
        <ul className="mobile-menu__list">
          <li>
            <a href="#hero" onClick={closeMobileMenu} className="mobile-menu__link">
              Главная
            </a>
          </li>
          <li>
            <a href="#services" onClick={closeMobileMenu} className="mobile-menu__link">
              Услуги
            </a>
          </li>
          <li>
            <a href="#pricing" onClick={closeMobileMenu} className="mobile-menu__link">
              Цены
            </a>
          </li>
          <li>
            <a href="#advantages" onClick={closeMobileMenu} className="mobile-menu__link">
              Преимущества
            </a>
          </li>
          <li>
            <a href="#contacts" onClick={closeMobileMenu} className="mobile-menu__link">
              Контакты
            </a>
          </li>
        </ul>
        <div className="mobile-menu__footer">
          <a href="tel:+74959990088" className="mobile-menu__phone">
            +7 (495) 999-00-88
          </a>
          <button 
            type="button"
            className="btn-gold mobile-menu__cta"
            onClick={() => {
              closeMobileMenu();
              onOpenBooking();
            }}
          >
            Записаться онлайн
          </button>
        </div>
      </div>
    </header>
  );
}
