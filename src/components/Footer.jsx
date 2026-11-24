import { Link } from 'react-router-dom';
import { LogoEmblem, MailIcon, PhoneIcon, PinIcon } from './Icons';
import './Footer.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="layout-grid footer__grid">
          <div className="footer__brand">
            <Link to="/" className="footer__logo">
              <LogoEmblem />
              <span>PremiumWash</span>
            </Link>
            <p className="footer__notice">
              Демонстраційна вітрина. Послуги, ціни та контактні дані наведено для прикладу.
            </p>
          </div>

          <nav aria-label="Розділи сайту">
            <h2 className="footer__title">Розділи</h2>
            <ul className="footer__list">
              <li><Link to="/">Головна</Link></li>
              <li><Link to="/services">Послуги</Link></li>
              <li><Link to="/pricing">Калькулятор цін</Link></li>
              <li><Link to="/advantages">Переваги</Link></li>
              <li><Link to="/contacts">Контакти</Link></li>
              <li><Link to="/booking">Онлайн-запис</Link></li>
            </ul>
          </nav>

          <nav aria-label="Послуги дітейлінгу">
            <h2 className="footer__title">Послуги</h2>
            <ul className="footer__list">
              <li><Link to="/services">Відновлювальне полірування</Link></li>
              <li><Link to="/services">Керамічні покриття</Link></li>
              <li><Link to="/services">Хімчистка салону</Link></li>
              <li><Link to="/services">Антигравійний захист PPF</Link></li>
              <li><Link to="/pricing">Комплексні пакети</Link></li>
            </ul>
          </nav>

          <div className="footer__contacts">
            <h2 className="footer__title">Демонстраційні контакти</h2>
            <address className="footer__list">
              <span><PinIcon />м. Київ, вул. Автомобільна, 1</span>
              <a href="tel:+380440000000"><PhoneIcon />+380 (44) 000-00-00</a>
              <a href="mailto:demo@premiumwash.example"><MailIcon />demo@premiumwash.example</a>
            </address>
          </div>
        </div>
        <p className="footer__copyright">© {currentYear} PremiumWash</p>
      </div>
    </footer>
  );
}
