import { useState } from 'react';
import { Link } from 'react-router-dom';
import Pricing from '../components/Pricing';
import { PlusIcon, MinusIcon, ArrowRightIcon } from '../components/Icons';
import './PagesCommon.css';

const faqs = [
  {
    q: 'Що входить в офіційну гарантію на кераміку?',
    a: 'Гарантія покриває збереження гідрофобного ефекту та стійкість дзеркального глянцю. Кожні 6 місяців ми запрошуємо на безкоштовний контрольний огляд та оновлення захисного шару (Top Coat).'
  },
  {
    q: 'Скільки часу триває повний комплекс дітейлінгу?',
    a: 'Якісне відновлювальне полірування та нанесення 2–3 шарів кераміки з полімеризацією в ІЧ-сушці тривають від 2 до 3 днів. Ми не прискорюємо технологічні інтервали на шкоду довговічності.'
  },
  {
    q: 'Чи можна приїхати на огляд перед вибором тарифу?',
    a: 'Так! Огляд лакофарбового покриття товщиноміром і складання індивідуального плану робіт безкоштовні та ні до чого вас не зобов’язують.'
  },
  {
    q: 'Як здійснюється оплата послуг?',
    a: 'Оплата проводиться після завершення всіх робіт та підписання акта прийому. Приймаємо банківські картки, безготівковий розрахунок для юридичних осіб та готівку.'
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
            <Link to="/">Головна</Link>
            <span className="page-hero__sep">/</span>
            <span>Тарифи та калькулятор</span>
          </div>
          <h1 className="page-hero__title">
            Вартість послуг та <span className="gold-text">комплексні пакети</span>
          </h1>
          <p className="page-hero__desc">
            Прозоре ціноутворення без прихованих доплат. Оберіть категорію вашого автомобіля для точного розрахунку вартості.
          </p>
        </div>
      </section>

      {/* Pricing Calculator */}
      <Pricing hideHeader={true} />

      {/* Pricing FAQ */}
      <section style={{ padding: '80px 0', backgroundColor: '#0b0c10' }}>
        <div className="container" style={{ maxWidth: '860px' }}>
          <div className="section-header">
            <div className="gold-sub-title">ВІДПОВІДІ НА ЗАПИТАННЯ</div>
            <h2 className="section-title">
              Поширені <span className="gold-text">запитання</span>
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
                  <span style={{ color: 'var(--color-gold)', display: 'flex', alignItems: 'center' }}>
                    {openFaq === idx ? <MinusIcon size={18} /> : <PlusIcon size={18} />}
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
                Бажаєте індивідуальний <span className="gold-text">розрахунок під ваше авто?</span>
              </h3>
              <p className="cta-banner__desc">
              Залиште онлайн-заявку для подальшого узгодження оптимального пакета догляду.
              </p>
            </div>
            <Link to="/booking" className="btn-gold" style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <span>Забронювати візит</span>
              <ArrowRightIcon size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
