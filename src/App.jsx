import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import { SparkleIcon, ArrowUpIcon } from './components/Icons';

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

        {/* Floating Controls with Motion Animation */}
        <AnimatePresence>
          {showScrollTop && (
            <motion.div
              className="floating-controls floating-controls--visible"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                to="/booking"
                className="btn-floating-cta"
                title="Записатися онлайн"
                aria-label="Записатися онлайн"
              >
                <span className="floating-sparkle">
                  <SparkleIcon size={16} />
                </span>
                <span className="floating-text">Записатися</span>
              </Link>

              <button
                type="button"
                className="btn-scroll-top"
                onClick={scrollToTop}
                title="Вгору"
                aria-label="Вгору"
              >
                <ArrowUpIcon size={18} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </BrowserRouter>
  );
}

export default App;
