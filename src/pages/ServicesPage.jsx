import { Link } from 'react-router-dom';
import Services from '../components/Services';
import { ArrowRightIcon } from '../components/Icons';
import './PagesCommon.css';

const processSteps = [
  {
    num: '01',
    title: 'Прийом та сканування ЛФП',
    desc: 'Вимірюємо товщину заводського лаку на кожному елементі за допомогою ультразвукового товщиноміра та складаємо карту дефектів.'
  },
  {
    num: '02',
    title: '3-фазне миття та деконтамінація',
    desc: 'Глибоке очищення кузова від бітуму, гальмівного пилу та органічних смол із застосуванням нейтральної синтетичної глини.'
  },
  {
    num: '03',
    title: 'Багатоетапне полірування',
    desc: 'Філігранне усунення рисок, мікроподряпин і голограм пастами Rupes без критичного стоншення захисного шару лаку.'
  },
  {
    num: '04',
    title: 'Нанесення кераміки або PPF',
    desc: 'Багатошарова консервація покриття в чистому боксі з контролем вологості й температури та сушкою в інфрачервоній камері.'
  },
  {
    num: '05',
    title: 'Інспекційний контроль Scangrip',
    desc: 'Фінальна перевірка технологом під професійним студійним світлом із високим індексом кольоропередачі CRI 96+.'
  }
];

export default function ServicesPage() {
  return (
    <div className="services-page">
      {/* Page Hero Header */}
      <section className="page-hero">
        <div className="container">
          <div className="page-hero__breadcrumbs">
            <Link to="/">Головна</Link>
            <span className="page-hero__sep">/</span>
            <span>Послуги дітейлінгу</span>
          </div>
          <h1 className="page-hero__title">
            Ексклюзивні послуги <span className="gold-text">дітейлінгу</span>
          </h1>
          <p className="page-hero__desc">
            Повний спектр високотехнологічних процедур з догляду за кузовом, склом, оптикою та інтер’єром автомобілів преміум і суперкар-сегмента.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <Services hideHeader={true} />

      {/* Process Workflow Section */}
      <section className="process-section" style={{ padding: '80px 0', backgroundColor: '#0b0c10' }}>
        <div className="container">
          <div className="section-header">
            <div className="gold-sub-title">ТЕХНОЛОГІЧНИЙ ПРОЦЕС</div>
            <h2 className="section-title">
              5 етапів досконалості <span className="gold-text">в нашій студії</span>
            </h2>
            <p className="section-desc">
              Ми суворо дотримуємося регламентів європейських дітейлінг-ательє, виключаючи поспіх і компроміси з якістю.
            </p>
          </div>

          <div className="process-grid">
            {processSteps.map((step) => (
              <div
                key={step.num}
                className="process-step-card"
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
                Не впевнені, яка процедура <span className="gold-text">підійде вашому авто?</span>
              </h3>
              <p className="cta-banner__desc">
                Запишіться на безкоштовну 15-хвилинну дефектовку ЛФП із технологом у нашій студії.
              </p>
            </div>
            <Link to="/booking" className="btn-gold" style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <span>Записатися на огляд</span>
              <ArrowRightIcon size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
