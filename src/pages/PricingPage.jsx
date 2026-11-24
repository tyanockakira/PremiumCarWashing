import { useState } from 'react';
import Pricing from '../components/Pricing';
import { DetailDisclosure, DetailHero, DetailReveal } from '../components/DetailPageParts';
import { PlusIcon } from '../components/Icons';
import headlightPhoto from '../assets/premiumwash/booking-headlight.webp';

const faqs = [
  {
    question: 'Як уточнити умови догляду за керамічним покриттям?',
    answer: 'Під час підбору покриття уточніть рекомендований догляд, умови гарантії та час наступного огляду.',
  },
  {
    question: 'Скільки часу триває повний комплекс дітейлінгу?',
    answer: 'Тривалість залежить від обсягу робіт. Орієнтовний час зазначено для кожного пакета.',
  },
  {
    question: 'Чи можна приїхати на огляд перед вибором тарифу?',
    answer: 'Так. Під час огляду можна перевірити стан лакофарбового покриття й узгодити індивідуальний перелік робіт.',
  },
  {
    question: 'Як здійснюється оплата послуг?',
    answer: 'Оплата після завершення робіт і підписання акта приймання. Доступні оплата карткою, готівкою та безготівковий розрахунок для юридичних осіб.',
  },
];

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="pricing-page detail-page">
      <DetailHero
        number="03"
        label="Тарифні комплекси"
        lines={['Ціни на', 'дітейлінг']}
        description="Порівняйте пакети: від регулярного догляду до відновлення й захисту кузова та салону."
        photo={headlightPhoto}
      />

      <Pricing />

      <section className="cinema-container pricing-faq detail-section" aria-labelledby="pricing-faq-heading">
        <DetailReveal>
          <h2 id="pricing-faq-heading" className="cinema-heading detail-section__title">Поширені запитання</h2>
        </DetailReveal>
        <div className="pricing-faq__list">
          {faqs.map(({ question, answer }, index) => {
            const open = openFaq === index;
            const panelId = `pricing-faq-${index}`;

            return (
              <div className="pricing-faq__item" data-open={open} key={question}>
                <h3>
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => setOpenFaq((current) => current === index ? null : index)}
                  >
                    {question}
                    <PlusIcon size={16} />
                  </button>
                </h3>
                <DetailDisclosure id={panelId} open={open}>
                  <p>{answer}</p>
                </DetailDisclosure>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
