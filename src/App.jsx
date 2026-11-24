import { forwardRef, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useIsPresent } from 'motion/react';
import BookingEntryModal from './components/BookingEntryModal';
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import { useDetailReducedMotion } from './components/useDetailReducedMotion';
import { duration, easeGlide, easeOut } from './lib/motion';

import HomePage from './pages/HomePage';
import ServicesPage from './pages/ServicesPage';
import PricingPage from './pages/PricingPage';
import AdvantagesPage from './pages/AdvantagesPage';
import BookingPage from './pages/BookingPage';

import './App.css';

const PageFrame = forwardRef(function PageFrame({ location, reduce, onOpenConsultation }, ref) {
  const isPresent = useIsPresent();

  return (
    <motion.div
      ref={ref}
      className="page-transition-wrapper"
      inert={!isPresent}
      initial={reduce ? false : { y: 10, opacity: 0.92 }}
      animate={{ y: 0, opacity: 1 }}
      exit={reduce ? undefined : { y: -8, opacity: 0, transition: { duration: 0.15, ease: easeGlide } }}
      transition={{ duration: reduce ? 0 : duration.page, ease: easeOut }}
    >
      <Routes location={location}>
        <Route path="/" element={<HomePage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/advantages" element={<AdvantagesPage />} />
        <Route path="/booking" element={<BookingPage onOpenConsultation={onOpenConsultation} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </motion.div>
  );
});

function AnimatedRoutes({ onOpenConsultation }) {
  const location = useLocation();
  const reduce = useDetailReducedMotion();

  if (location.pathname.toLowerCase().replace(/\/$/, '') === '/contacts') {
    return <Navigate to="/booking?mode=consultation" replace />;
  }

  return (
    <>
      <ScrollToTop />
      <AnimatePresence initial={false} mode="popLayout">
        <PageFrame key={location.pathname} location={location} reduce={reduce} onOpenConsultation={onOpenConsultation} />
      </AnimatePresence>
    </>
  );
}

function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const [entry, setEntry] = useState(null);
  const [dismissedQuery, setDismissedQuery] = useState(null);
  const sessionCount = useRef(0);
  const focusBooking = useRef(false);
  const isBooking = location.pathname.toLowerCase().replace(/\/$/, '') === '/booking';
  const params = new URLSearchParams(location.search);
  const opensFromQuery = isBooking && params.get('mode') === 'consultation';
  if (entry && entry.locationKey !== location.key) setEntry(null);

  const session = opensFromQuery && dismissedQuery !== location.key
    ? { id: location.key, initialMode: 'consultation' }
    : entry?.locationKey === location.key ? entry : null;

  function openEntry(initialMode, opener) {
    sessionCount.current += 1;
    setEntry({ id: sessionCount.current, locationKey: location.key, initialMode, opener });
  }

  function closeEntry() {
    setEntry(null);
    if (opensFromQuery) {
      setDismissedQuery(location.key);
      params.delete('mode');
      navigate(
        { pathname: location.pathname, search: params.toString(), hash: location.hash },
        { replace: true, state: location.state },
      );
    }
  }

  function chooseBooking() {
    closeEntry();
    if (isBooking) return;

    focusBooking.current = true;
    navigate('/booking');
  }

  function restoreFocus(opener) {
    const canRestore = opener?.isConnected && opener !== document.body
      && opener.getClientRects().length > 0 && !opener.closest('[inert]');
    const bookingHeading = document.querySelector('.page-transition-wrapper:not([inert]) #booking-title');
    const target = (focusBooking.current || !canRestore) && bookingHeading
      ? bookingHeading
      : canRestore ? opener : document.querySelector('.header__logo');

    focusBooking.current = false;
    target?.focus({ preventScroll: true });
  }

  return (
    <>
      <div className="app-wrapper">
        <Header onOpenBooking={(opener) => openEntry('choice', opener)} />
        <main>
          <AnimatedRoutes onOpenConsultation={(opener) => openEntry('consultation', opener)} />
        </main>
        <Footer />
      </div>
      <BookingEntryModal
        session={session}
        onClose={closeEntry}
        onChooseBooking={chooseBooking}
        onAfterClose={restoreFocus}
      />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

export default App;
