import { Link } from 'react-router-dom';
import Contacts from '../components/Contacts';
import { CarIcon, CoffeeIcon, ShieldIcon, ArrowRightIcon } from '../components/Icons';
import './PagesCommon.css';

export default function ContactsPage() {
  return (
    <div className="contacts-page">
      {/* Page Hero */}
      <section className="page-hero">
        <div className="container">
          <div className="page-hero__breadcrumbs">
            <Link to="/">Головна</Link>
            <span className="page-hero__sep">/</span>
            <span>Контакти та локація</span>
          </div>
          <h1 className="page-hero__title">
            Контакти студії <span className="gold-text">Premium Car Wash</span>
          </h1>
          <p className="page-hero__desc">
            Чекаємо на вас за зручною демонстраційною адресою в Києві. Закрита територія, цілодобовий прийом 24/7 та комфортабельний VIP-лаундж.
          </p>
        </div>
      </section>

      {/* Main Contacts & Form */}
      <Contacts hideHeader={true} />

      {/* Location Directions */}
      <section style={{ padding: '80px 0', backgroundColor: '#090a0e' }}>
        <div className="container">
          <div className="section-header">
            <div className="gold-sub-title">ЯК ДІСТАТИСЯ</div>
            <h2 className="section-title">
              Схема проїзду та <span className="gold-text">перепустковий режим</span>
            </h2>
            <p className="section-desc">
              Територія дітейлінг-центру закрита для сторонніх. Умови доступу та можливість оформлення гостьової перепустки уточнюються окремо після збереження заявки.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
            marginTop: '30px'
          }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '26px' }}>
              <span style={{ display: 'flex', alignItems: 'center', color: 'var(--color-gold)', width: '1.8rem', height: '1.8rem' }}><CarIcon size={26} /></span>
              <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#ffffff', margin: '12px 0 6px' }}>В’їзд на автомобілі</h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
                З’їзд за вказівником комплексу «Автомобільна 1». На КПП №1 назвіть прізвище або номер авто — шлагбаум відкриється автоматично.
              </p>
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '26px' }}>
              <span style={{ display: 'flex', alignItems: 'center', color: 'var(--color-gold)', width: '1.8rem', height: '1.8rem' }}><CoffeeIcon size={26} /></span>
              <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#ffffff', margin: '12px 0 6px' }}>VIP-Лаундж зона</h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
                Поки автомобіль проходить процедуру, ви можете відпочити у затишній лаундж-зоні з преміальною зерновою кавою, чаєм і швидкісним Wi-Fi.
              </p>
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '26px' }}>
              <span style={{ display: 'flex', alignItems: 'center', color: 'var(--color-gold)', width: '1.8rem', height: '1.8rem' }}><ShieldIcon size={26} /></span>
              <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#ffffff', margin: '12px 0 6px' }}>Охоронюваний паркінг</h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
                Теплий критий паркінг із постійним відеоспостереженням 4K. Доступ сторонніх осіб у робочі зони суворо заборонений.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="page-cta-banner">
        <div className="container">
          <div className="cta-banner-box">
            <div>
              <h3 className="cta-banner__title">
                Бажаєте записатися просто зараз?
              </h3>
              <p className="cta-banner__desc">
                Оберіть зручну дату та часовий слот онлайн за 1 хвилину.
              </p>
            </div>
            <Link to="/booking" className="btn-gold" style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <span>Онлайн-запис</span>
              <ArrowRightIcon size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
