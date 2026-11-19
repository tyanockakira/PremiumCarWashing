import { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Services from './components/Services';
import Pricing from './components/Pricing';
import Advantages from './components/Advantages';
import Contacts from './components/Contacts';
import Footer from './components/Footer';
import BookingModal from './components/BookingModal';
import './App.css';

function App() {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedService, setSelectedService] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const checkScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', checkScroll);
    return () => window.removeEventListener('scroll', checkScroll);
  }, []);

  const handleOpenBooking = () => {
    setSelectedService('Восстановительная полировка');
    setIsBookingOpen(true);
  };

  const handleCloseBooking = () => {
    setIsBookingOpen(false);
  };

  const handleSelectService = (serviceName) => {
    setSelectedService(serviceName);
    setIsBookingOpen(true);
  };

  const handleSelectPackage = (packageName) => {
    setSelectedService(packageName);
    setIsBookingOpen(true);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="app-wrapper">
      {/* Navigation Header */}
      <Header onOpenBooking={handleOpenBooking} />

      {/* Main Content */}
      <main>
        {/* 1. Hero Section with Luxury Car */}
        <Hero onOpenBooking={handleOpenBooking} />

        {/* 2. Services Cards */}
        <Services onSelectService={handleSelectService} />

        {/* 3. Pricing Packages & Calculator */}
        <Pricing onSelectPackage={handleSelectPackage} />

        {/* 4. Quality Standards & Advantages */}
        <Advantages />

        {/* 5. Contacts & Location */}
        <Contacts onOpenBooking={handleOpenBooking} />
      </main>

      {/* Footer */}
      <Footer />

      {/* Interactive Booking Modal */}
      <BookingModal 
        key={selectedService}
        isOpen={isBookingOpen} 
        onClose={handleCloseBooking} 
        initialService={selectedService}
      />

      {/* Floating Action & Back to Top */}
      <div className={`floating-controls ${showScrollTop ? 'floating-controls--visible' : ''}`}>
        <button 
          type="button" 
          className="btn-floating-cta"
          onClick={handleOpenBooking}
          title="Записаться онлайн"
          aria-label="Записаться онлайн"
        >
          <span className="floating-sparkle">✦</span>
          <span className="floating-text">Записаться</span>
        </button>

        <button 
          type="button" 
          className="btn-scroll-top"
          onClick={scrollToTop}
          title="Наверх"
          aria-label="Наверх"
        >
          ↑
        </button>
      </div>
    </div>
  );
}

export default App;
