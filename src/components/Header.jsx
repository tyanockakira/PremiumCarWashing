import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ArrowRightIcon, CalendarIcon, CloseIcon, MenuIcon } from './Icons';
import './Header.css';

const navigation = [
  { path: '/', label: 'Головна' },
  { path: '/services', label: 'Послуги' },
  { path: '/pricing', label: 'Ціни' },
  { path: '/advantages', label: 'Переваги' },
];

export default function Header({ onOpenBooking }) {
  const { pathname } = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const headerRow = useRef(null);
  const menuToggle = useRef(null);

  useLayoutEffect(() => {
    const row = headerRow.current;
    const activeLink = row.querySelector('.nav__link[aria-current="page"], .header__cta[data-booking-page]');
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
    row.querySelectorAll('.header__logo, .header__nav, .nav__link, .header__cta')
      .forEach((element) => observer.observe(element));

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

  const closeAfterNavigation = (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    setMobileMenuOpen(false);
    menuToggle.current.focus({ preventScroll: true });
  };

  const handleHeaderBlur = (event) => {
    if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) {
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className="header" onBlur={handleHeaderBlur}>
      <div className="cinema-container header__container" ref={headerRow}>
        <Link to="/" className="brand-lockup header__logo" onClick={() => setMobileMenuOpen(false)}>
          <img src="/brand/mark.svg" alt="" width="70" height="46" />
          <span className="header__brand">
            <span className="brand-lockup__wordmark">PREMIUMWASH</span>
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
          <button
            type="button"
            className="btn-outline cinema-button header__cta"
            data-booking-page={pathname === '/booking' || undefined}
            aria-haspopup="dialog"
            aria-controls="booking-entry-dialog"
            onClick={(event) => onOpenBooking(event.currentTarget)}
          >
            <CalendarIcon />
            Записатися
            <ArrowRightIcon size={16} className="cinema-arrow cinema-arrow--diagonal" />
          </button>
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
        <div className="cinema-container mobile-menu__content">
          <ul className="mobile-menu__list">
            {navigation.map(({ path, label }, index) => (
              <li key={path} style={{ '--menu-item': index }}>
                <NavLink to={path} end className="mobile-menu__link" onClick={closeAfterNavigation}>
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="mobile-menu__actions" style={{ '--menu-item': navigation.length }}>
            <button
              type="button"
              className="btn-platinum cinema-button mobile-menu__booking"
              aria-haspopup="dialog"
              aria-controls="booking-entry-dialog"
              onClick={() => {
                setMobileMenuOpen(false);
                menuToggle.current.focus({ preventScroll: true });
                onOpenBooking(menuToggle.current);
              }}
            >
              Записатися
              <ArrowRightIcon size={16} className="cinema-arrow cinema-arrow--diagonal" />
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
}
