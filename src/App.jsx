import { Component, forwardRef, lazy, Suspense, useLayoutEffect, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useIsPresent } from 'motion/react';
import BookingEntryModal from './components/BookingEntryModal';
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import { useDetailReducedMotion } from './components/useDetailReducedMotion';
import { duration, easeGlide, easeOut } from './lib/motion';

import HomePage from './pages/HomePage';
import './App.css';

const isChunkLoadError = (error) => /(?:dynamically imported module|importing a module script|loading chunk|failed to fetch dynamically)/i.test(error?.message ?? '');

const ServicesPage = lazy(() => import('./pages/ServicesPage'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const AdvantagesPage = lazy(() => import('./pages/AdvantagesPage'));
const LazyBookingPage = lazy(() => import('./pages/BookingPage'));

const bookingHeadingSelector = '.page-transition-wrapper:not([inert]) #booking-title';

class RouteErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  handleRetry = () => {
    window.location.reload();
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const chunkError = isChunkLoadError(error);
    return (
      <section className="route-error" role="alert" aria-live="assertive">
        <h1>{chunkError ? 'Сторінка оновлюється' : 'Не вдалося відобразити сторінку'}</h1>
        <p>
          {chunkError
            ? 'Оновлення сайту ще завантажується. Повторіть спробу, щоб отримати актуальну версію.'
            : 'Сталася помилка під час відкриття сторінки. Повторіть спробу або поверніться на головну.'}
        </p>
        <button type="button" className="btn-platinum cinema-button" onClick={this.handleRetry}>
          Спробувати ще раз
        </button>
      </section>
    );
  }
}

const PageFrame = forwardRef(function PageFrame({ location, reduce, onOpenConsultation, initialPage: InitialPage, initialRoute }, ref) {
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
        {InitialPage && initialRoute === location.pathname.toLowerCase().replace(/\/$/, '') && (
          <Route path={initialRoute} element={<InitialPage onOpenConsultation={onOpenConsultation} />} />
        )}
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/advantages" element={<AdvantagesPage />} />
        <Route path="/booking" element={<LazyBookingPage onOpenConsultation={onOpenConsultation} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </motion.div>
  );
});

function AnimatedRoutes({ onOpenConsultation, focusBookingRef, initialPage, initialRoute }) {
  const location = useLocation();
  const reduce = useDetailReducedMotion();

  useLayoutEffect(() => {
    if (!focusBookingRef.current || document.querySelector('#booking-entry-dialog[open]')) return;

    const heading = document.querySelector(bookingHeadingSelector);
    if (heading) {
      focusBookingRef.current = false;
      heading.focus({ preventScroll: true });
    }
  }, [location.pathname, focusBookingRef]);

  if (location.pathname.toLowerCase().replace(/\/$/, '') === '/contacts') {
    return <Navigate to="/booking?mode=consultation" replace />;
  }

  return (
    <>
      <main>
        <ScrollToTop />
        <AnimatePresence initial={false} mode="popLayout">
          <PageFrame key={location.pathname} location={location} reduce={reduce} onOpenConsultation={onOpenConsultation} initialPage={initialPage} initialRoute={initialRoute} />
        </AnimatePresence>
      </main>
      <Footer />
    </>
  );
}

function AppShell({ initialPage, initialRoute }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [entry, setEntry] = useState(null);
  const [dismissedQuery, setDismissedQuery] = useState(null);
  const sessionCount = useRef(0);
  const focusBookingRef = useRef(false);
  const normalizedPath = location.pathname.toLowerCase().replace(/\/$/, '') || '/';
  const isBooking = normalizedPath === '/booking';
  const isInitialRoute = normalizedPath === initialRoute;
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

    focusBookingRef.current = true;
    navigate('/booking');
  }

  function restoreFocus(opener) {
    const canRestore = opener?.isConnected && opener !== document.body
      && opener.getClientRects().length > 0 && !opener.closest('[inert]');
    const bookingHeading = document.querySelector(bookingHeadingSelector);
    const target = (focusBookingRef.current || !canRestore) && bookingHeading
      ? bookingHeading
      : canRestore ? opener : document.querySelector('.header__logo');

    if (bookingHeading || window.location.pathname !== '/booking') focusBookingRef.current = false;
    target?.focus({ preventScroll: true });
  }

  return (
    <>
      <div className="app-wrapper">
        <Header onOpenBooking={(opener) => openEntry('choice', opener)} />
        {(!isInitialRoute || initialPage) && (
          <RouteErrorBoundary key={location.pathname}>
            <Suspense fallback={null}>
              <AnimatedRoutes onOpenConsultation={(opener) => openEntry('consultation', opener)} focusBookingRef={focusBookingRef} initialPage={isInitialRoute ? initialPage : null} initialRoute={initialRoute} />
            </Suspense>
          </RouteErrorBoundary>
        )}
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

function App({ initialPage, initialRoute }) {
  return (
    <BrowserRouter>
      <AppShell initialPage={initialPage} initialRoute={initialRoute} />
    </BrowserRouter>
  );
}

export default App;
