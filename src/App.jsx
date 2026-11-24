import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import { CalendarIcon, ArrowUpIcon } from './components/Icons';

import HomePage from './pages/HomePage';
import ServicesPage from './pages/ServicesPage';
import PricingPage from './pages/PricingPage';
import AdvantagesPage from './pages/AdvantagesPage';
import ContactsPage from './pages/ContactsPage';
import BookingPage from './pages/BookingPage';

import './App.css';

function PageWrapper({ children, animate = true }) {
  return (
    <div className={animate ? 'page-transition-wrapper page-transition-wrapper--enter' : 'page-transition-wrapper'}>
      <ScrollToTop />
      {children}
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <Routes location={location} key={location.pathname}>
      <Route path="/" element={<PageWrapper animate={false}><HomePage /></PageWrapper>} />
      <Route path="/services" element={<PageWrapper><ServicesPage /></PageWrapper>} />
      <Route path="/pricing" element={<PageWrapper><PricingPage /></PageWrapper>} />
      <Route path="/advantages" element={<PageWrapper><AdvantagesPage /></PageWrapper>} />
      <Route path="/contacts" element={<PageWrapper><ContactsPage /></PageWrapper>} />
      <Route path="/booking" element={<PageWrapper><BookingPage /></PageWrapper>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const checkScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', checkScroll);
    return () => window.removeEventListener('scroll', checkScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: shouldReduceMotion ? 'auto' : 'smooth' });
  };

  return (
    <BrowserRouter>
      <div className="app-wrapper">
        {/* Navigation Header */}
        <Header />

        {/* Dynamic Route Content with Smooth Page Transitions */}
        <main>
          <AnimatedRoutes />
        </main>

        {/* Footer */}
        <Footer />

        {/* Floating Controls with Motion Animation */}
        <AnimatePresence>
          {showScrollTop && (
            <motion.div
              className="floating-controls"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: shouldReduceMotion ? 0 : 4 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.12, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                to="/booking"
                className="btn-platinum btn-floating-cta"
                title="Записатися онлайн"
                aria-label="Записатися онлайн"
              >
                <CalendarIcon />
                <span className="floating-text">Записатися</span>
              </Link>

              <button
                type="button"
                className="btn-scroll-top"
                onClick={scrollToTop}
                title="Вгору"
                aria-label="Вгору"
              >
                <ArrowUpIcon />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </BrowserRouter>
  );
}

export default App;
