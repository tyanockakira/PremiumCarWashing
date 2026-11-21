import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        {/* Prominent Demo Notice */}
        <div className="footer-demo-alert">
          <span className="footer-demo-alert__icon">⚠️</span>
          <div className="footer-demo-alert__text">
            <strong>Демонстраційний сайт.</strong> Усі послуги, ціни, контактні дані та форми наведені виключно для прикладу й не є реальними комерційними пропозиціями.
          </div>
        </div>

        <div className="footer-top">
          {/* Brand info */}
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <span className="footer-logo__symbol">✦</span>
              <span className="footer-logo__text">PREMIUM<span className="gold-text">WASH</span></span>
            </Link>
            <p className="footer-desc">
              Ексклюзивний догляд за преміальними автомобілями, спорткарами та колекційними моделями.
              Стандарти провідних європейських дітейлінг-ательє.
            </p>
            <div className="footer-badges">
              <span className="brand-pill">Gyeon Certified</span>
              <span className="brand-pill">Rupes Authorized</span>
              <span className="brand-pill">Koch Chemie</span>
            </div>
          </div>

          {/* Nav links */}
          <div className="footer-col">
            <h4 className="footer-col__title">Навігація</h4>
            <ul className="footer-nav">
              <li><Link to="/">Головна</Link></li>
              <li><Link to="/services">Послуги дітейлінгу</Link></li>
              <li><Link to="/pricing">Калькулятор цін</Link></li>
              <li><Link to="/advantages">Переваги</Link></li>
              <li><Link to="/contacts">Контакти</Link></li>
              <li><Link to="/booking">Онлайн-запис</Link></li>
            </ul>
          </div>

          {/* Services quick links */}
          <div className="footer-col">
            <h4 className="footer-col__title">Послуги</h4>
            <ul className="footer-nav">
              <li><Link to="/services">Відновлювальне полірування</Link></li>
              <li><Link to="/services">Нанокераміка 9H / 10H</Link></li>
              <li><Link to="/services">Детейлінг-хімчистка</Link></li>
              <li><Link to="/services">Антигравійний захист PPF</Link></li>
              <li><Link to="/pricing">Комплексні пакети</Link></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="footer-col">
            <h4 className="footer-col__title">Зв’язок з нами</h4>
            <div className="footer-contact-list">
              <p>📍 м. Київ, вул. Автомобільна, 1 (демо-адреса)</p>
              <p>📞 <a href="tel:+380440000000">+380 (44) 000-00-00</a></p>
              <p>⏱️ Працюємо цілодобово 24/7</p>
              <p>✉️ <a href="mailto:demo@premiumwash.example">demo@premiumwash.example</a></p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <p className="footer-copy">
            © {currentYear} Premium Car Wash Studio. Демонстраційний вітринний проєкт.
          </p>
          <p className="footer-craft">
            Створено з турботою про бездоганну якість та естетику
          </p>
        </div>
      </div>
    </footer>
  );
}
