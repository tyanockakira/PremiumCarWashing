import { Link } from 'react-router-dom';
import Advantages from '../components/Advantages';
import { BuildingIcon, SnowflakeIcon, ArrowRightIcon } from '../components/Icons';
import './PagesCommon.css';

const partnerBrands = [
  { name: 'Rupes BigFoot', country: 'Італія', desc: 'Професійне ексцентрикове полірувальне обладнання преміум-класу номер один у світі.' },
  { name: 'Gyeon Quartz', country: 'Південна Корея', desc: 'Еталонні нанокерамічні захисні покриття на основі діоксиду кремнію (SiO2).' },
  { name: 'Koch Chemie', country: 'Німеччина', desc: 'Преміальна автохімія, схвалена концернами Mercedes-Benz, BMW та Audi.' },
  { name: 'Scangrip Detailing', country: 'Данія', desc: 'Спеціалізоване студійне інспекційне світло з індексом передачі кольору CRI 96+.' },
  { name: 'LeTech Leather Lab', country: 'Велика Британія', desc: 'Елітні формули реставрації, живлення та захисту натуральної автомобільної шкіри.' }
];

export default function AdvantagesPage() {
  return (
    <div className="advantages-page">
      {/* Page Hero */}
      <section className="page-hero">
        <div className="container">
          <div className="page-hero__breadcrumbs">
            <Link to="/">Головна</Link>
            <span className="page-hero__sep">/</span>
            <span>Переваги та стандарти</span>
          </div>
          <h1 className="page-hero__title">
            Стандарти дітейлінгу <span className="gold-text">найвищої проби</span>
          </h1>
          <p className="page-hero__desc">
            Наша студія спроєктована як чиста лабораторія. Ми поєднуємо передове обладнання, стерильний мікроклімат і сертифікованих майстрів.
          </p>
        </div>
      </section>

      {/* Main Grid */}
      <Advantages hideHeader={true} />

      {/* Brands & Technologies Showcase */}
      <section style={{ padding: '80px 0', backgroundColor: '#090a0e' }}>
        <div className="container">
          <div className="section-header">
            <div className="gold-sub-title">ОБЛАДНАННЯ ТА МАТЕРІАЛИ</div>
            <h2 className="section-title">
              Працюємо тільки зі <span className="gold-text">світовими лідерами</span>
            </h2>
            <p className="section-desc">
              Жодних безіменних складів. Кожен флакон сертифікований і постачається офіційними дистриб’юторами.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
            marginTop: '40px'
          }}>
            {partnerBrands.map((brand, idx) => (
              <div
                key={idx}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '30px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#ffffff', lineHeight: '1.2' }}>
                    {brand.name}
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-gold)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {brand.country}
                  </span>
                </div>
                <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: '1.6', marginTop: '6px' }}>
                  {brand.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security & Warranty Banner */}
      <section style={{ padding: '60px 0', backgroundColor: '#111217', borderTop: '1px solid var(--border-subtle)' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
          <div style={{ padding: '24px', background: 'rgba(212, 175, 55, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-gold-subtle)' }}>
            <span style={{ display: 'flex', alignItems: 'center', color: 'var(--color-gold)', width: '2rem', height: '2rem' }}><BuildingIcon size={28} /></span>
            <h4 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#ffffff', margin: '10px 0 6px' }}>
              Страхування на 50 000 000 грн
            </h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
              Кожен прийнятий автомобіль на весь час проведення робіт застрахований у провідній страховій компанії.
            </p>
          </div>

          <div style={{ padding: '24px', background: 'rgba(212, 175, 55, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-gold-subtle)' }}>
            <span style={{ display: 'flex', alignItems: 'center', color: 'var(--color-gold)', width: '2rem', height: '2rem' }}><SnowflakeIcon size={28} /></span>
            <h4 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#ffffff', margin: '10px 0 6px' }}>
              Клімат-контроль 22°C
            </h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
              Стерильні бокси з постійною температурою, вологістю 50% та багатоступеневим очищенням повітря від пилу.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="page-cta-banner">
        <div className="container">
          <div className="cta-banner-box">
            <div>
              <h3 className="cta-banner__title">
                Довірте автомобіль <span className="gold-text">професіоналам</span>
              </h3>
              <p className="cta-banner__desc">
                Забронюйте візит онлайн та переконайтеся у найвищих стандартах преміального сервісу.
              </p>
            </div>
            <Link to="/booking" className="btn-gold" style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <span>Записатися в студію</span>
              <ArrowRightIcon size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
