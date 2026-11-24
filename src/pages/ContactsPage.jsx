import { Link } from 'react-router-dom';
import Contacts from '../components/Contacts';
import { ArrowRightIcon, CalendarIcon } from '../components/Icons';

export default function ContactsPage() {
  return (
    <section className="detail-page contacts-page" aria-labelledby="contacts-page-title">
      <div className="contacts-page__planes" aria-hidden="true" />
      <div className="cinema-container contacts-page__layout">
        <div className="contacts-page__intro">
          <p className="cinema-label contacts-enter">Зв’язок зі студією</p>
          <h1 id="contacts-page-title" className="contacts-page__title">
            <span><span>Обговорімо</span></span>{' '}
            <span><span>ваше авто</span></span>
          </h1>
          <p className="contacts-page__description contacts-enter">
            Розкажіть, що хочете відновити чи захистити. Допоможемо підібрати догляд за кузовом або салоном.
          </p>
        </div>

        <section className="contacts-panel" aria-labelledby="consultation-title">
          <Contacts />
        </section>

        <div className="contacts-page__booking contacts-enter">
          <CalendarIcon size={18} />
          <div>
            <p>Уже обрали послугу?</p>
            <Link to="/booking">
              Перейти до онлайн-запису
              <ArrowRightIcon size={18} className="cinema-arrow cinema-arrow--diagonal" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
