import './Advantages.css';

const advantages = [
  {
    icon: '⚡',
    title: 'Инспекционный свет Scangrip',
    desc: 'Каждый этап полировки контролируется специализированным студийным светом с разной цветовой температурой (CRI 96+).'
  },
  {
    icon: '🛡️',
    title: 'Чистые боксы с климат-контролем',
    desc: 'Нанесение керамических составов и пленок происходит в стерильных условиях при температуре 22°C и влажности 50%.'
  },
  {
    icon: '🏆',
    title: 'Сертифицированные мастера',
    desc: 'Все специалисты имеют стаж более 6 лет и ежегодно подтверждают квалификацию в европейских академиях Gyeon и Rupes.'
  },
  {
    icon: '💎',
    title: 'Топовая мировая химия',
    desc: 'Используем только бескомпромиссные составы из Германии, Великобритании и Японии: Koch Chemie, Gyeon, LeTech, Rupes.'
  },
  {
    icon: '🎥',
    title: 'Охрана 24/7 и видеонаблюдение',
    desc: 'Закрытый тёплый паркинг с постоянной охраной, видеоконтролем 4K и страхованием ответственности на 50 000 000 ₽.'
  },
  {
    icon: '📋',
    title: 'Контроль качества по 45 пунктам',
    desc: 'Финальная приёмка автомобиля технологом по строгой шкале дефектовки перед выдачей владельцу.'
  }
];

export default function Advantages({ hideHeader = false }) {
  return (
    <section id="advantages" className="advantages-section">
      <div className="container">
        {!hideHeader && (
          <div className="section-header">
            <div className="gold-sub-title">ПОЧЕМУ ВЫБИРАЮТ НАС</div>
            <h2 className="section-title">
              Стандарты качества <span className="gold-text">без компромиссов</span>
            </h2>
            <p className="section-desc">
              Мы относимся к каждому автомобилю как к уникальному произведению инженерного искусства.
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
