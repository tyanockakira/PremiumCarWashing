import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import './PagesCommon.css';

const hubSections = [
  {
    icon: '✨',
    subtitle: 'КАТАЛОГ',
    title: 'Услуги детейлинга',
    desc: 'Многоэтапная полировка, керамика 9H Pro, оклейка полиуретаном PPF и премиальный уход за кожей салона.',
    link: '/services',
    linkText: 'Перейти к услугам'
  },
  {
    icon: '💳',
    subtitle: 'ПРАЙС-ЛИСТ',
    title: 'Калькулятор цен',
    desc: '3 сбалансированных комплекса ухода с мгновенным автоматическим расчетом под класс вашего автомобиля.',
    link: '/pricing',
    linkText: 'Рассчитать стоимость'
  },
  {
    icon: '🛡️',
    subtitle: 'СТАНДАРТЫ',
    title: 'Преимущества студии',
    desc: 'Стерильные боксы с климат-контролем 22°C, датский инспекционный свет Scangrip и страховка на 50 000 000 ₽.',
    link: '/advantages',
    linkText: 'О наших стандартах'
  },
  {
    icon: '📍',
    subtitle: 'ЛОКАЦИЯ',
    title: 'Контакты и визит',
    desc: 'Студия на Кутузовском проспекте, круглосуточная приёмка 24/7, закрытый паркинг и комфортный VIP-лаундж.',
    link: '/contacts',
    linkText: 'Контакты и проезд'
  }
];

export default function HomePage() {
  return (
    <div className="home-page">
      {/* 1. Главный экран (Hero) */}
      <Hero />

      {/* 2. Навигационный хаб по ключевым разделам */}
      <section className="home-hub-section">
        <div className="container">
          <div className="section-header">
            <div className="gold-sub-title">PREMIUM CAR WASH STUDIO</div>
            <h2 className="section-title">
              Совершенство в <span className="gold-text">каждой детали</span>
            </h2>
            <p className="section-desc">
              Выберите интересующий раздел, чтобы ознакомиться с полным каталогом услуг,
              рассчитать стоимость или записаться на визит.
            </p>
          </div>

          <div className="home-hub-grid">
            {hubSections.map((item, idx) => (
              <Link to={item.link} key={idx} className="home-hub-card">
                <div className="home-hub-card__icon">{item.icon}</div>
                <span className="home-hub-card__sub">{item.subtitle}</span>
                <h3 className="home-hub-card__title">{item.title}</h3>
                <p className="home-hub-card__desc">{item.desc}</p>
                <div className="home-hub-card__link">
                  <span>{item.linkText}</span>
                  <span className="hub-arrow">→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Финальный баннер быстрой онлайн-записи */}
      <section className="page-cta-banner" style={{ marginTop: '40px', marginBottom: '100px' }}>
        <div className="container">
          <div className="cta-banner-box">
            <div>
              <h3 className="cta-banner__title">
                Готовы подарить вашему автомобилю <span className="gold-text">безупречный блеск?</span>
              </h3>
              <p className="cta-banner__desc">
                Забронируйте удобное время визита онлайн. Мы подготовим индивидуальный чистый бокс и персонального мастера-приёмщика.
              </p>
            </div>
            <Link to="/booking" className="btn-gold" style={{ flexShrink: 0 }}>
              Записаться онлайн →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
