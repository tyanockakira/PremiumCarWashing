import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import { SparkleIcon, CreditCardIcon, ShieldIcon, PinIcon } from '../components/Icons';
import './PagesCommon.css';

const hubSections = [
  {
    Icon: SparkleIcon,
    subtitle: 'КАТАЛОГ',
    title: 'Послуги дітейлінгу',
    desc: 'Багатоетапне полірування, кераміка 9H Pro, обклеювання поліуретаном PPF та преміальний догляд за шкірою салону.',
    link: '/services',
    linkText: 'Перейти до послуг'
  },
  {
    Icon: CreditCardIcon,
    subtitle: 'ПРАЙС-ЛИСТ',
    title: 'Калькулятор цін',
    desc: '3 збалансовані комплекси догляду з миттєвим автоматичним розрахунком під клас вашого автомобіля.',
    link: '/pricing',
    linkText: 'Розрахувати вартість'
  },
  {
    Icon: ShieldIcon,
    subtitle: 'СТАНДАРТИ',
    title: 'Переваги студії',
    desc: 'Стерильні бокси з клімат-контролем 22°C, інспекційне світло Scangrip та страхування відповідальності.',
    link: '/advantages',
    linkText: 'Про наші стандарти'
  },
  {
    Icon: PinIcon,
    subtitle: 'ЛОКАЦІЯ',
    title: 'Контакти та візит',
    desc: 'Зручний заїзд, цілодобовий прийом 24/7, закритий паркінг і затишна VIP-лаундж зона.',
    link: '/contacts',
    linkText: 'Контакти та проїзд'
  }
];

export default function HomePage() {
  return (
    <div className="home-page">
      {/* 1. Головний екран (Hero) */}
      <Hero />

      {/* 2. Навігаційний хаб по ключових розділах */}
      <section className="home-hub-section">
        <div className="container">
          <div className="section-header">
            <div className="gold-sub-title">PREMIUM CAR WASH STUDIO • ДЕМО-ВІТРИНА</div>
            <h2 className="section-title">
              Досконалість у <span className="gold-text">кожній деталі</span>
            </h2>
            <p className="section-desc">
              Оберіть потрібний розділ, щоб ознайомитися з повним каталогом послуг,
              розрахувати вартість або оформити демонстраційний запис на візит.
            </p>
          </div>

          <div className="home-hub-grid">
            {hubSections.map((item, idx) => (
              <Link to={item.link} key={idx} className="home-hub-card">
                <div className="home-hub-card__icon"><item.Icon size={22} /></div>
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

      {/* 3. Фінальний банер швидкого онлайн-запису */}
      <section className="page-cta-banner" style={{ marginTop: '40px', marginBottom: '100px' }}>
        <div className="container">
          <div className="cta-banner-box">
            <div>
              <h3 className="cta-banner__title">
                Готові подарувати вашому авто <span className="gold-text">бездоганний блиск?</span>
              </h3>
              <p className="cta-banner__desc">
                Забронюйте зручний час візиту онлайн. Ми підготуємо індивідуальний чистий бокс і персонального майстра-технолога.
              </p>
            </div>
            <Link to="/booking" className="btn-gold" style={{ flexShrink: 0 }}>
              Записатися онлайн →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
