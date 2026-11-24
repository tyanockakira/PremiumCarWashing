import { Link } from 'react-router-dom';
import { ArrowRightIcon } from './Icons';
import './Footer.css';

const links = [
  { path: '/', label: 'Головна' },
  { path: '/services', label: 'Послуги' },
  { path: '/pricing', label: 'Ціни' },
  { path: '/advantages', label: 'Переваги' },
  { path: '/contacts', label: 'Контакти' },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="cinema-container">
        <div className="footer__main">
          <div className="footer__brand">
            <Link to="/" className="brand-lockup">
              <img src="/brand/mark.svg" alt="" width="70" height="46" />
              <span className="brand-lockup__wordmark">PREMIUMWASH</span>
            </Link>
            <p className="footer__notice">Демонстраційна вітрина дітейлінгу</p>
          </div>
          <nav aria-label="Розділи сайту">
            <ul className="footer__list">
              {links.map(({ path, label }) => (
                <li key={path}><Link to={path}>{label}</Link></li>
              ))}
            </ul>
          </nav>
          <Link to="/booking" className="btn-outline cinema-button footer__cta">
            Онлайн-запис <ArrowRightIcon size={16} className="cinema-arrow cinema-arrow--diagonal" />
          </Link>
        </div>
        <p className="footer__copyright">© {new Date().getFullYear()} PremiumWash</p>
      </div>
    </footer>
  );
}
