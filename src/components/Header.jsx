import { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { LogoEmblem, PhoneIcon } from './Icons';
import './Header.css';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
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
        {/* Brand Logo with Demo Tag */}
        <Link to="/" className="header__logo" onClick={closeMobileMenu}>
          <div className="logo-emblem">
            <span className="logo-symbol">
              <LogoEmblem size={20} />
            </span>
          </div>
          <div className="logo-text">
            <span className="logo-brand">PREMIUM<span className="logo-gold">WASH</span></span>
            <span className="logo-sub">DETAILING STUDIO • ДЕМО</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="header__nav">
          <ul className="nav__list">
            <li>
              <NavLink
                to="/"
                end
                className={({ isActive }) => `nav__link ${isActive ? 'nav__link--active' : ''}`}
              >
                Головна
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/services"
                className={({ isActive }) => `nav__link ${isActive ? 'nav__link--active' : ''}`}
              >
                Послуги
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/pricing"
                className={({ isActive }) => `nav__link ${isActive ? 'nav__link--active' : ''}`}
              >
                Ціни
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/advantages"
                className={({ isActive }) => `nav__link ${isActive ? 'nav__link--active' : ''}`}
              >
                Переваги
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/contacts"
                className={({ isActive }) => `nav__link ${isActive ? 'nav__link--active' : ''}`}
              >
                Контакти
              </NavLink>
            </li>
          </ul>
        </nav>

        {/* Action button & Phone */}
        <div className="header__actions">
          <a href="tel:+380440000000" className="header__phone" title="Демонстраційний номер">
            <span className="phone-icon" style={{ display: 'flex', alignItems: 'center' }}>
              <PhoneIcon size={16} />
            </span>
            <span className="phone-number">+380 (44) 000-00-00</span>
          </a>
          <Link to="/booking" className="btn-platinum header__cta">
            Записатися
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          className={`hamburger ${mobileMenuOpen ? 'hamburger--active' : ''}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Відкрити меню"
        >
          <span className="hamburger__line"></span>
          <span className="hamburger__line"></span>
          <span className="hamburger__line"></span>
        </button>
      </div>

      {/* Mobile Drawer Menu with AnimatePresence */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="mobile-menu"
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -20 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <ul className="mobile-menu__list">
              <li>
                <NavLink
                  to="/"
                  end
                  onClick={closeMobileMenu}
                  className={({ isActive }) => `mobile-menu__link ${isActive ? 'mobile-menu__link--active' : ''}`}
                >
                  Головна
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/services"
                  onClick={closeMobileMenu}
                  className={({ isActive }) => `mobile-menu__link ${isActive ? 'mobile-menu__link--active' : ''}`}
                >
                  Послуги
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/pricing"
                  onClick={closeMobileMenu}
                  className={({ isActive }) => `mobile-menu__link ${isActive ? 'mobile-menu__link--active' : ''}`}
                >
                  Ціни
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/advantages"
                  onClick={closeMobileMenu}
                  className={({ isActive }) => `mobile-menu__link ${isActive ? 'mobile-menu__link--active' : ''}`}
                >
                  Переваги
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/contacts"
                  onClick={closeMobileMenu}
                  className={({ isActive }) => `mobile-menu__link ${isActive ? 'mobile-menu__link--active' : ''}`}
                >
                  Контакти
                </NavLink>
              </li>
            </ul>
            <div className="mobile-menu__footer">
              <span className="mobile-menu__demo-tag">Демонстраційний сайт</span>
              <a href="tel:+380440000000" className="mobile-menu__phone">
                +380 (44) 000-00-00
              </a>
              <Link
                to="/booking"
                className="btn-platinum mobile-menu__cta"
                onClick={closeMobileMenu}
              >
                Онлайн-запис
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
