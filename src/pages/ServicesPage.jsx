import { Link } from 'react-router-dom';
import Services from '../components/Services';
import './PagesCommon.css';

const processSteps = [
  {
    num: '01',
    title: 'Приёмка и сканирование ЛКП',
    desc: 'Замеряем толщину заводского лака на каждом элементе с помощью ультразвукового толщиномера и составляем карту дефектов.'
  },
  {
    num: '02',
    title: '3-фазная мойка и деконтаминация',
    desc: 'Глубокая очистка кузова от битума, колодочной пыли и смол с применением нейтральной синтетической глины.'
  },
  {
    num: '03',
    title: 'Многоэтапная полировка',
    desc: 'Филигранное устранение рисок, микроцарапин и паутинок пастами Rupes без истончения слоя прозрачного лака.'
  },
  {
    num: '04',
    title: 'Нанесение керамики или PPF',
    desc: 'Многослойная консервация покрытия в чистом боксе с контролем температуры и закреплением в инфракрасной сушке.'
  },
  {
    num: '05',
    title: 'Инспекционный контроль Scangrip',
    desc: 'Финальная проверка мастером-технологом под специальным студийным светом и выдача авто с сертификатом качества.'
  }
];

export default function ServicesPage() {
  return (
    <div className="services-page">
      {/* Page Hero Header */}
      <section className="page-hero">
        <div className="container">
          <div className="page-hero__breadcrumbs">
            <Link to="/">Главная</Link>
            <span className="page-hero__sep">/</span>
            <span>Услуги детейлинга</span>
          </div>
          <h1 className="page-hero__title">
            Эксклюзивные услуги <span className="gold-text">детейлинга</span>
          </h1>
          <p className="page-hero__desc">
            Полный спектр высокотехнологичных процедур по уходу за кузовом, стеклами, оптикой и интерьером автомобилей премиум и суперкар-сегмента.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <Services hideHeader={true} />

      {/* Process Workflow Section */}
      <section className="process-section" style={{ padding: '80px 0', backgroundColor: '#0b0c10' }}>
        <div className="container">
          <div className="section-header">
            <div className="gold-sub-title">ТЕХНОЛОГИЧЕСКИЙ ПРОЦЕСС</div>
            <h2 className="section-title">
              5 этапов совершенства <span className="gold-text">в нашей студии</span>
            </h2>
            <p className="section-desc">
              Мы строго следуем регламентам европейских детейлинг-ателье, исключая спешку и компромиссы.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '24px',
            marginTop: '40px'
          }}>
            {processSteps.map((step) => (
              <div
                key={step.num}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '28px 22px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <span style={{
                  fontSize: '2rem',
                  fontWeight: '900',
                  color: 'var(--color-gold)',
                  fontFamily: 'var(--font-serif)',
                  lineHeight: '1'
                }}>
                  {step.num}
                </span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#ffffff' }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="page-cta-banner">
        <div className="container">
          <div className="cta-banner-box">
            <div>
              <h3 className="cta-banner__title">
                Не уверены, какая процедура <span className="gold-text">подойдет вашему авто?</span>
              </h3>
              <p className="cta-banner__desc">
                Запишитесь на бесплатную 15-минутную дефектовку ЛКП с технологом в нашей студии.
              </p>
            </div>
            <Link to="/booking" className="btn-gold" style={{ flexShrink: 0 }}>
              Записаться на осмотр →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
