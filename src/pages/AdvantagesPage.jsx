import { Link } from 'react-router-dom';
import Advantages from '../components/Advantages';
import './PagesCommon.css';

const partnerBrands = [
  { name: 'Rupes BigFoot', country: 'Италия', desc: 'Профессиональное эксцентриковое полировальное оборудование номер один в мире.' },
  { name: 'Gyeon Quartz', country: 'Южная Корея', desc: 'Эталонные нанокерамические защитные покрытия на основе диоксида кремния (SiO2).' },
  { name: 'Koch Chemie', country: 'Германия', desc: 'Премиальная автохимия, одобренная концернами Daimler, BMW и Audi.' },
  { name: 'Scangrip Detailing', country: 'Дания', desc: 'Специализированный студийный инспекционный свет с индексом цветопередачи CRI 96+.' },
  { name: 'LeTech Leather Lab', country: 'Великобритания', desc: 'Элитные формулы реставрации, питания и защиты натуральной автомобильной кожи.' }
];

export default function AdvantagesPage() {
  return (
    <div className="advantages-page">
      {/* Page Hero */}
      <section className="page-hero">
        <div className="container">
          <div className="page-hero__breadcrumbs">
            <Link to="/">Главная</Link>
            <span className="page-hero__sep">/</span>
            <span>Преимущества и стандарты</span>
          </div>
          <h1 className="page-hero__title">
            Стандарты детейлинга <span className="gold-text">высшей пробы</span>
          </h1>
          <p className="page-hero__desc">
            Наша студия спроектирована как чистая лаборатория. Мы объединяем передовое оборудование, стерильный микроклимат и сертифицированных специалистов.
          </p>
        </div>
      </section>

      {/* Main Grid */}
      <Advantages hideHeader={true} />

      {/* Brands & Technologies Showcase */}
      <section style={{ padding: '80px 0', backgroundColor: '#090a0e' }}>
        <div className="container">
          <div className="section-header">
            <div className="gold-sub-title">ОБОРУДОВАНИЕ И МАТЕРИАЛЫ</div>
            <h2 className="section-title">
              Работаем только с <span className="gold-text">мировыми лидерами</span>
            </h2>
            <p className="section-desc">
              Никаких безымянных составов. Каждый флакон сертифицирован и поставляется официальными дистрибьюторами.
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#ffffff' }}>
                    {brand.name}
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-gold)', textTransform: 'uppercase', letterSpacing: '1px' }}>
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
            <span style={{ fontSize: '2rem' }}>🏛️</span>
            <h4 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#ffffff', margin: '10px 0 6px' }}>
              Страхование на 50 000 000 ₽
            </h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
              Каждый принятый автомобиль на все время проведения работ застрахован в ведущей страховой компании.
            </p>
          </div>

          <div style={{ padding: '24px', background: 'rgba(212, 175, 55, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-gold-subtle)' }}>
            <span style={{ fontSize: '2rem' }}>❄️</span>
            <h4 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#ffffff', margin: '10px 0 6px' }}>
              Климат-контроль 22°C
            </h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
              Стерильные боксы с постоянной температурой, влажностью 50% и многоступенчатой очисткой воздуха от пыли.
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
                Доверьте автомобиль <span className="gold-text">профессионалам</span>
              </h3>
              <p className="cta-banner__desc">
                Забронируйте визит онлайн и убедитесь в высочайших стандартах премиального сервиса.
              </p>
            </div>
            <Link to="/booking" className="btn-gold" style={{ flexShrink: 0 }}>
              Записаться в студию →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
