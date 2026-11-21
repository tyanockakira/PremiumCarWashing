import { Link } from 'react-router-dom';
import Contacts from '../components/Contacts';
import './PagesCommon.css';

export default function ContactsPage() {
  return (
    <div className="contacts-page">
      {/* Page Hero */}
      <section className="page-hero">
        <div className="container">
          <div className="page-hero__breadcrumbs">
            <Link to="/">Главная</Link>
            <span className="page-hero__sep">/</span>
            <span>Контакты и локация</span>
          </div>
          <h1 className="page-hero__title">
            Контакты студии <span className="gold-text">Premium Car Wash</span>
          </h1>
          <p className="page-hero__desc">
            Ждем вас в удобной престижной локации на Кутузовском проспекте. Закрытая охраняемая территория, круглосуточная приёмка 24/7 и комфортабельный VIP-лаундж.
          </p>
        </div>
      </section>

      {/* Main Contacts & Form */}
      <Contacts hideHeader={true} />

      {/* Location Directions */}
      <section style={{ padding: '80px 0', backgroundColor: '#090a0e' }}>
        <div className="container">
          <div className="section-header">
            <div className="gold-sub-title">КАК ДОБРАТЬСЯ</div>
            <h2 className="section-title">
              Схема проезда и <span className="gold-text">пропускной режим</span>
            </h2>
            <p className="section-desc">
              Территория детейлинг-центра закрыта для посторонних. При подтверждении записи мы автоматически оформляем гостевой пропуск на ваш госномер.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
            marginTop: '30px'
          }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '26px' }}>
              <span style={{ fontSize: '1.8rem', color: 'var(--color-gold)' }}>🚗</span>
              <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#ffffff', margin: '12px 0 6px' }}>Въезд на автомобиле</h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
                Съезд с Кутузовского проспекта по указателю «Кутузовский 36». На КПП №1 назовите фамилию или госномер — шлагбаум откроется автоматически.
              </p>
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '26px' }}>
              <span style={{ fontSize: '1.8rem', color: 'var(--color-gold)' }}>☕</span>
              <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#ffffff', margin: '12px 0 6px' }}>VIP-Лаундж зона</h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
                Пока автомобиль проходит процедуру, вы можете отдохнуть в комфортной лаундж-зоне с премиальным зерновым кофе, чаем и скоростным Wi-Fi.
              </p>
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '26px' }}>
              <span style={{ fontSize: '1.8rem', color: 'var(--color-gold)' }}>🛡️</span>
              <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#ffffff', margin: '12px 0 6px' }}>Охраняемый паркинг</h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
                Тёплый подземный паркинг с постоянным видеонаблюдением 4K. Доступ посторонних лиц в рабочие зоны строго запрещён.
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
                Хотите записаться прямо сейчас?
              </h3>
              <p className="cta-banner__desc">
                Выберите удобную дату и временной слот онлайн за 1 минуту.
              </p>
            </div>
            <Link to="/booking" className="btn-gold" style={{ flexShrink: 0 }}>
              Онлайн-запись →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
