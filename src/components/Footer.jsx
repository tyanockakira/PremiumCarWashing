import './Footer.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          {/* Brand info */}
          <div className="footer-brand">
            <div className="footer-logo">
              <span className="footer-logo__symbol">✦</span>
              <span className="footer-logo__text">PREMIUM<span className="gold-text">WASH</span></span>
            </div>
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
              <li><a href="#hero">Главная</a></li>
              <li><a href="#services">Услуги детейлинга</a></li>
              <li><a href="#pricing">Калькулятор цен</a></li>
              <li><a href="#advantages">Преимущества</a></li>
              <li><a href="#contacts">Контакты</a></li>
            </ul>
          </div>

          {/* Services quick links */}
          <div className="footer-col">
            <h4 className="footer-col__title">Услуги</h4>
            <ul className="footer-nav">
              <li><a href="#services">Восстановительная полировка</a></li>
              <li><a href="#services">Нанокерамика 9H / 10H</a></li>
              <li><a href="#services">Детейлинг-химчистка</a></li>
              <li><a href="#services">Антигравийная защита PPF</a></li>
              <li><a href="#services">Антидождь на стёкла</a></li>
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
