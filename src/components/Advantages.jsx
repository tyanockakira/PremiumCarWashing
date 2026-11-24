import { motion, useReducedMotion } from 'motion/react';
import {
  ZapIcon,
  ShieldIcon,
  TrophyIcon,
  GemIcon,
  CameraIcon,
  FileCheckIcon
} from './Icons';
import './Advantages.css';

const advantages = [
  {
    icon: <ZapIcon size={22} />,
    title: 'Інспекційне світло Scangrip',
    desc: 'Кожен етап полірування контролюється спеціалізованим студійним світлом з різною колірною температурою (CRI 96+).'
  },
  {
    icon: <ShieldIcon size={22} />,
    title: 'Чисті бокси з клімат-контролем',
    desc: 'Нанесення керамічних складів та плівок відбувається за температури 22°C та контрольованої вологості 50%.'
  },
  {
    icon: <TrophyIcon size={22} />,
    title: 'Сертифіковані майстри',
    desc: 'Усі фахівці мають стаж понад 6 років та щорічно підтверджують кваліфікацію в європейських академіях Gyeon і Rupes.'
  },
  {
    icon: <GemIcon size={22} />,
    title: 'Світова преміальна хімія',
    desc: 'Використовуємо виключно безкомпромісні склади з Німеччини, Великої Британії та Японії: Koch Chemie, Gyeon, LeTech, Rupes.'
  },
  {
    icon: <CameraIcon size={22} />,
    title: 'Охорона 24/7 та відеоспостереження',
    desc: 'Закритий теплий паркінг із постійною охороною, відеоконтролем 4K та відповідальним страхуванням автомобіля.'
  },
  {
    icon: <FileCheckIcon size={22} />,
    title: 'Контроль якості за 45 пунктами',
    desc: 'Фінальний огляд автомобіля технологом за суворою шкалою дефектування перед видачею клієнту.'
  }
];

export default function Advantages({ hideHeader = false }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section id="advantages" className="advantages-section">
      <div className="container">
        {!hideHeader && (
          <motion.div
            className="section-header"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="tech-sub-title">ЧОМУ ОБИРАЮТЬ НАС</div>
            <h2 className="section-title">
              Стандарти якості <span className="platinum-text">без компромісів</span>
            </h2>
            <p className="section-desc">
              Ми ставимося до кожного автомобіля як до унікального витвору інженерного мистецтва.
            </p>
          </motion.div>
        )}

        <div className="advantages-grid">
          {advantages.map((item, idx) => (
            <motion.div
              key={idx}
              className="advantage-card"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
              whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.5, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="advantage-card__icon">{item.icon}</div>
              <h3 className="advantage-card__title">{item.title}</h3>
              <p className="advantage-card__desc">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
