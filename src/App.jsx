import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';

import HomePage from './pages/HomePage';
import ServicesPage from './pages/ServicesPage';
import PricingPage from './pages/PricingPage';
import AdvantagesPage from './pages/AdvantagesPage';
import ContactsPage from './pages/ContactsPage';
import BookingPage from './pages/BookingPage';

import './App.css';

function App() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const checkScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', checkScroll);
    return () => window.removeEventListener('scroll', checkScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="app-wrapper">
        {/* Navigation Header */}
        <Header />

        {/* Dynamic Route Content */}
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/advantages" element={<AdvantagesPage />} />
            <Route path="/contacts" element={<ContactsPage />} />
            <Route path="/booking" element={<BookingPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Footer */}
        <Footer />

        {/* Floating Controls */}
        <div className={`floating-controls ${showScrollTop ? 'floating-controls--visible' : ''}`}>
          <Link
            to="/booking"
            className="btn-floating-cta"
            title="Записатися онлайн"
            aria-label="Записатися онлайн"
          >
            <span className="floating-sparkle">✦</span>
            <span className="floating-text">Записатися</span>
          </Link>

          <button
            type="button"
            className="btn-scroll-top"
            onClick={scrollToTop}
            title="Вгору"
            aria-label="Вгору"
          >
            ↑
          </button>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
