import { useState } from 'react';
import { Link } from 'react-router-dom';
import Pricing from '../components/Pricing';
import './PagesCommon.css';

const faqs = [
  {
    q: 'Что входит в официальную гарантию на керамику?',
    a: 'Гарантия покрывает гидрофобный эффект и стойкость глянца. Каждые 6 месяцев мы приглашаем вас на бесплатный контрольный осмотр и обновление защитного гидрофобного слоя (Top Coat).'
  },
  {
    q: 'Сколько времени занимает полный комплекс детейлинга?',
    a: 'Качественная восстановительная полировка и нанесение 2-3 слоев керамики с выдержкой в ИК-сушке занимают от 2 до 3 дней. Мы не ускоряем технологические интервалы в ущерб качеству.'
  },
  {
    q: 'Можно ли приехать на осмотр перед выбором тарифа?',
    a: 'Да! Осмотр ЛКП толщиномером и составление детального плана работ бесплатны и ни к чему вас не обязывают.'
  },
  {
    q: 'Как оплачиваются услуги?',
    a: 'Оплата производится после завершения всех работ и подписания акта приемки. Принимаем банковские карты, безналичный расчет для юридических лиц и наличные.'
  }
];

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="pricing-page">
      {/* Page Hero Header */}
      <section className="page-hero">
        <div className="container">
          <div className="page-hero__breadcrumbs">
            <Link to="/">Главная</Link>
            <span className="page-hero__sep">/</span>
            <span>Тарифы и калькулятор</span>
          </div>
          <h1 className="page-hero__title">
            Стоимость услуг и <span className="gold-text">комплексные пакеты</span>
          </h1>
          <p className="page-hero__desc">
            Прозрачное ценообразование без скрытых доплат. Выберите категорию вашего автомобиля для точного расчета стоимости.
          </p>
        </div>
      </section>

      {/* Pricing Calculator */}
      <Pricing hideHeader={true} />

      {/* Pricing FAQ */}
      <section style={{ padding: '80px 0', backgroundColor: '#0b0c10' }}>
        <div className="container" style={{ maxWidth: '860px' }}>
          <div className="section-header">
            <div className="gold-sub-title">ОТВЕТЫ НА ВОПРОСЫ</div>
            <h2 className="section-title">
              Часто задаваемые <span className="gold-text">вопросы</span>
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                onClick={() => toggleFaq(idx)}
                style={{
                  background: 'var(--bg-card)',
                  border: openFaq === idx ? '1px solid var(--border-gold)' : '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '22px 26px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: openFaq === idx ? 'var(--color-gold-light)' : '#ffffff' }}>
                    {faq.q}
                  </h4>
                  <span style={{ color: 'var(--color-gold)', fontSize: '1.3rem', fontWeight: '300' }}>
                    {openFaq === idx ? '−' : '+'}
                  </span>
                </div>
                {openFaq === idx && (
                  <p style={{ marginTop: '14px', fontSize: '0.92rem', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                    {faq.a}
                  </p>
                )}
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
                Хотите индивидуальный <span className="gold-text">расчет под ваш авто?</span>
              </h3>
              <p className="cta-banner__desc">
                Оставьте заявку онлайн — мастер свяжется с вами и предложит идеальный пакет ухода.
              </p>
            </div>
            <Link to="/booking" className="btn-gold" style={{ flexShrink: 0 }}>
              Забронировать визит →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
