import './Advantages.css';

const advantages = [
  {
    icon: '⚡',
    title: 'Інспекційне світло Scangrip',
    desc: 'Кожен етап полірування контролюється спеціалізованим студійним світлом з різною колірною температурою (CRI 96+).'
  },
  {
    icon: '🛡️',
    title: 'Чисті бокси з клімат-контролем',
    desc: 'Нанесення керамічних складів та плівок відбувається за температури 22°C та контрольованої вологості 50%.'
  },
  {
    icon: '🏆',
    title: 'Сертифіковані майстри',
    desc: 'Усі фахівці мають стаж понад 6 років та щорічно підтверджують кваліфікацію в європейських академіях Gyeon і Rupes.'
  },
  {
    icon: '💎',
    title: 'Світова преміальна хімія',
    desc: 'Використовуємо виключно безкомпромісні склади з Німеччини, Великої Британії та Японії: Koch Chemie, Gyeon, LeTech, Rupes.'
  },
  {
    icon: '🎥',
    title: 'Охорона 24/7 та відеоспостереження',
    desc: 'Закритий теплий паркінг із постійною охороною, відеоконтролем 4K та відповідальним страхуванням автомобіля.'
  },
  {
    icon: '📋',
    title: 'Контроль якості за 45 пунктами',
    desc: 'Фінальний огляд автомобіля технологом за суворою шкалою дефектування перед видачею клієнту.'
  }
];

export default function Advantages({ hideHeader = false }) {
  return (
    <section id="advantages" className="advantages-section">
      <div className="container">
        {!hideHeader && (
          <div className="section-header">
            <div className="tech-sub-title">ЧОМУ ОБИРАЮТЬ НАС</div>
            <h2 className="section-title">
              Стандарти якості <span className="platinum-text">без компромісів</span>
            </h2>
            <p className="section-desc">
              Ми ставимося до кожного автомобіля як до унікального витвору інженерного мистецтва.
            </p>
          </div>
        )}

        <div className="advantages-grid">
          {advantages.map((item, idx) => (
            <div key={idx} className="advantage-card">
              <div className="advantage-card__icon">{item.icon}</div>
              <h3 className="advantage-card__title">{item.title}</h3>
              <p className="advantage-card__desc">{item.desc}</p>
              <div className="advantage-card__corner"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
