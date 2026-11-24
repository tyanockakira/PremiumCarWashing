import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import { ArrowRightIcon } from '../components/Icons';
import './HomePage.css';

const sections = [
  {
    path: '/services',
    title: 'Послуги дітейлінгу',
    description: 'Полірування, керамічні покриття, захисна плівка та хімчистка салону.',
  },
  {
    path: '/pricing',
    title: 'Калькулятор цін',
    description: 'Порівняйте пакети для свого класу автомобіля.',
  },
  {
    path: '/advantages',
    title: 'Обладнання й контроль якості',
    description: 'Дізнайтеся, яке обладнання використовують і як перевіряють результат.',
  },
  {
    path: '/contacts',
    title: 'Контакти та проїзд',
    description: 'Адреса, контактні дані та форма консультації.',
  },
];

export default function HomePage() {
  return (
    <div className="home-page">
      <Hero />

      <section className="home-directory" aria-labelledby="home-directory-title">
        <div className="container layout-grid home-directory__layout">
          <div className="home-directory__intro">
            <h2 id="home-directory-title">Догляд за автомобілем</h2>
            <p>Оберіть послугу, перегляньте склад робіт і розрахуйте вартість.</p>
          </div>

          <ul className="home-directory__list">
            {sections.map(({ path, title, description }) => (
              <li key={path}>
                <Link to={path} className="home-directory__link">
                  <span>
                    <span className="home-directory__title">{title}</span>
                    <span className="home-directory__description">{description}</span>
                  </span>
                  <ArrowRightIcon />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="container home-booking" aria-labelledby="home-booking-title">
        <h2 id="home-booking-title">Запис на дітейлінг</h2>
        <Link to="/booking" className="btn-platinum">
          Обрати дату й час <ArrowRightIcon />
        </Link>
      </section>
    </div>
  );
}
