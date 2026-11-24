import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { CloseIcon, LogoEmblem, MenuIcon, PhoneIcon } from './Icons';
import './Header.css';

const navigation = [
  { path: '/', label: 'Головна' },
  { path: '/services', label: 'Послуги' },
  { path: '/pricing', label: 'Ціни' },
  { path: '/advantages', label: 'Переваги' },
  { path: '/contacts', label: 'Контакти' },
];

export default function Header() {
  const { pathname } = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const headerRow = useRef(null);
  const menuToggle = useRef(null);

  useLayoutEffect(() => {
    const row = headerRow.current;
    const activeLink = row.querySelector('.nav__link[aria-current="page"], .header__cta[aria-current="page"]');
    const previousRoute = row.dataset.activeRoute;
    row.toggleAttribute('data-slide-indicator', Boolean(previousRoute && previousRoute !== pathname));

    if (!activeLink) {
      row.removeAttribute('data-active-route');
      return;
    }

    const positionIndicator = () => {
      const link = activeLink.getBoundingClientRect();
      if (!link.width) return;

      row.style.setProperty('--indicator-offset', (link.left - row.getBoundingClientRect().left) + 'px');
      row.style.setProperty('--indicator-scale', link.width);
      row.dataset.activeRoute = pathname;
    };

    positionIndicator();
    const observer = new ResizeObserver(positionIndicator);
    observer.observe(row);
    row.querySelectorAll('.nav__link, .header__cta').forEach((link) => observer.observe(link));

    return () => observer.disconnect();
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const desktop = window.matchMedia('(min-width: 1024px)');
    const closeMenu = () => setMobileMenuOpen(false);
    const closeFromHistory = () => {
      if (document.activeElement?.closest('#mobile-navigation')) menuToggle.current.focus();
      closeMenu();
    };
    const handleResize = (event) => {
      if (event.matches) closeMenu();
    };
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        closeMenu();
        menuToggle.current.focus();
      }
    };

    desktop.addEventListener('change', handleResize);
    window.addEventListener('popstate', closeFromHistory);
    document.addEventListener('keydown', handleEscape);

    return () => {
      desktop.removeEventListener('change', handleResize);
      window.removeEventListener('popstate', closeFromHistory);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [mobileMenuOpen]);

  const closeAfterNavigation = () => {
    setMobileMenuOpen(false);
    menuToggle.current.focus();
  };

  const handleHeaderBlur = (event) => {
    if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) {
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className="header" onBlur={handleHeaderBlur}>
      <div className="container header__container" ref={headerRow}>
        <Link to="/" className="header__logo" onClick={() => setMobileMenuOpen(false)}>
          <LogoEmblem />
          <span className="header__brand">
            <span className="header__wordmark">PremiumWash</span>
            <span className="header__subtitle">Демо-вітрина</span>
          </span>
        </Link>

        <nav className="header__nav" aria-label="Головна навігація">
          <ul className="nav__list">
            {navigation.map(({ path, label }) => (
              <li key={path}><NavLink to={path} end className="nav__link">{label}</NavLink></li>
            ))}
          </ul>
        </nav>

        <div className="header__actions">
          <a href="tel:+380440000000" className="header__phone" aria-label="Демонстраційний номер +380 (44) 000-00-00">
            <PhoneIcon />
            <span>+380 (44) 000-00-00</span>
          </a>
          <NavLink to="/booking" end className="btn-platinum header__cta">Записатися</NavLink>
        </div>

        <span className="header__indicator" aria-hidden="true" />

        <button
          ref={menuToggle}
          type="button"
          className="header__toggle"
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-navigation"
          aria-label={mobileMenuOpen ? 'Закрити меню' : 'Відкрити меню'}
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      <nav
        id="mobile-navigation"
        className="mobile-menu"
        aria-label="Мобільна навігація"
        data-open={mobileMenuOpen}
        inert={!mobileMenuOpen}
      >
        <div className="container mobile-menu__content">
          <ul className="mobile-menu__list">
            {navigation.map(({ path, label }) => (
              <li key={path}>
                <NavLink to={path} end className="mobile-menu__link" onClick={closeAfterNavigation}>
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="mobile-menu__actions">
            <a href="tel:+380440000000" className="mobile-menu__phone" title="Демонстраційний номер">
              <PhoneIcon />
              +380 (44) 000-00-00
            </a>
            <NavLink to="/booking" end className="btn-platinum" onClick={closeAfterNavigation}>
              Онлайн-запис
            </NavLink>
          </div>
        </div>
      </nav>
    </header>
  );
}
