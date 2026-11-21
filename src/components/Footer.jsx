import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          {/* Brand info */}
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <span className="footer-logo__symbol">✦</span>
              <span className="footer-logo__text">PREMIUM<span className="gold-text">WASH</span></span>
            </Link>
            <p className="footer-desc">
              Эксклюзивный уход за премиальными автомобилями, спорткарами и коллекционными моделями.
              Стандарты европейских детейлинг-ателье.
            </p>
            <div className="footer-badges">
              <span className="brand-pill">Gyeon Certified</span>
              <span className="brand-pill">Rupes Authorized</span>
              <span className="brand-pill">Koch Chemie</span>
            </div>
          </div>

          {/* Nav links */}
          <div className="footer-col">
            <h4 className="footer-col__title">Навигация</h4>
            <ul className="footer-nav">
              <li><Link to="/">Главная</Link></li>
              <li><Link to="/services">Услуги детейлинга</Link></li>
              <li><Link to="/pricing">Калькулятор цен</Link></li>
              <li><Link to="/advantages">Преимущества</Link></li>
              <li><Link to="/contacts">Контакты</Link></li>
              <li><Link to="/booking">Онлайн-запись</Link></li>
            </ul>
          </div>

          {/* Services quick links */}
          <div className="footer-col">
            <h4 className="footer-col__title">Услуги</h4>
            <ul className="footer-nav">
              <li><Link to="/services">Восстановительная полировка</Link></li>
              <li><Link to="/services">Нанокерамика 9H / 10H</Link></li>
              <li><Link to="/services">Детейлинг-химчистка</Link></li>
              <li><Link to="/services">Антигравийная защита PPF</Link></li>
              <li><Link to="/pricing">Комплексные пакеты</Link></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="footer-col">
            <h4 className="footer-col__title">Связь с нами</h4>
            <div className="footer-contact-list">
              <p>📍 Москва, Кутузовский пр-т, 36с1</p>
              <p>📞 <a href="tel:+74959990088">+7 (495) 999-00-88</a></p>
              <p>⏱️ Работаем круглосуточно 24/7</p>
              <p>✉️ concierge@premiumwash.ru</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <p className="footer-copy">
            © {currentYear} Premium Car Wash Studio. Все права защищены.
          </p>
          <p className="footer-craft">
            Разработано с заботой о безупречном качестве
          </p>
        </div>
      </div>
    </footer>
  );
}
