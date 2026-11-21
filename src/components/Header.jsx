import { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import './Header.css';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
        {/* Brand Logo */}
        <Link to="/" className="header__logo" onClick={closeMobileMenu}>
          <div className="logo-emblem">
            <span className="logo-symbol">✦</span>
          </div>
          <div className="logo-text">
            <span className="logo-brand">PREMIUM<span className="logo-gold">WASH</span></span>
            <span className="logo-sub">DETAILING STUDIO</span>
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
                Главная
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/services"
                className={({ isActive }) => `nav__link ${isActive ? 'nav__link--active' : ''}`}
              >
                Услуги
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/pricing"
                className={({ isActive }) => `nav__link ${isActive ? 'nav__link--active' : ''}`}
              >
                Цены
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/advantages"
                className={({ isActive }) => `nav__link ${isActive ? 'nav__link--active' : ''}`}
              >
                Преимущества
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/contacts"
                className={({ isActive }) => `nav__link ${isActive ? 'nav__link--active' : ''}`}
              >
                Контакты
              </NavLink>
            </li>
          </ul>
        </nav>

        {/* Action button & Phone */}
        <div className="header__actions">
          <a href="tel:+74959990088" className="header__phone">
            <span className="phone-icon">✆</span>
            <span className="phone-number">+7 (495) 999-00-88</span>
          </a>
          <Link to="/booking" className="btn-gold header__cta">
            Записаться
          </Link>
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
            <NavLink
              to="/"
              end
              onClick={closeMobileMenu}
              className={({ isActive }) => `mobile-menu__link ${isActive ? 'mobile-menu__link--active' : ''}`}
            >
              Главная
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/services"
              onClick={closeMobileMenu}
              className={({ isActive }) => `mobile-menu__link ${isActive ? 'mobile-menu__link--active' : ''}`}
            >
              Услуги
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/pricing"
              onClick={closeMobileMenu}
              className={({ isActive }) => `mobile-menu__link ${isActive ? 'mobile-menu__link--active' : ''}`}
            >
              Цены
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/advantages"
              onClick={closeMobileMenu}
              className={({ isActive }) => `mobile-menu__link ${isActive ? 'mobile-menu__link--active' : ''}`}
            >
              Преимущества
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/contacts"
              onClick={closeMobileMenu}
              className={({ isActive }) => `mobile-menu__link ${isActive ? 'mobile-menu__link--active' : ''}`}
            >
              Контакты
            </NavLink>
          </li>
        </ul>
        <div className="mobile-menu__footer">
          <a href="tel:+74959990088" className="mobile-menu__phone">
            +7 (495) 999-00-88
          </a>
          <Link
            to="/booking"
            className="btn-gold mobile-menu__cta"
            onClick={closeMobileMenu}
          >
            Онлайн-запись
          </Link>
        </div>
      </div>
    </header>
  );
}
