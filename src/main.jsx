import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import heroPhoto from './assets/premiumwash/hero-alternative.webp'
import { heroImageSizes, responsiveImages } from './data/responsiveImages'

function preloadHomeHero() {
  if (!['', '/'].includes(window.location.pathname)) return;

  const sources = [
    { media: '(max-width: 767px)', srcSet: responsiveImages.heroAlternative.mobileSrcSet },
    { media: '(min-width: 768px) and (max-width: 1199px)', srcSet: responsiveImages.heroAlternative.tabletSrcSet },
    { media: '(min-width: 1200px)', srcSet: responsiveImages.heroAlternative.srcSet },
  ];

  for (const { media, srcSet } of sources) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = heroPhoto;
    link.media = media;
    link.setAttribute('imagesrcset', srcSet);
    link.setAttribute('imagesizes', heroImageSizes);
    link.setAttribute('fetchpriority', 'high');
    document.head.appendChild(link);
  }
}

preloadHomeHero()

const root = createRoot(document.getElementById('root'))

const initialRouteLoaders = {
  '/services': () => import('./pages/ServicesPage'),
  '/pricing': () => import('./pages/PricingPage'),
  '/advantages': () => import('./pages/AdvantagesPage'),
  '/booking': () => import('./pages/BookingPage'),
}

function renderApp(initialPage, initialRoute) {
  root.render(
    <StrictMode>
      <App initialPage={initialPage} initialRoute={initialRoute} />
    </StrictMode>,
  )
}

const initialRoute = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/'
const loadInitialRoute = initialRouteLoaders[initialRoute]

if (loadInitialRoute) {
  // Render the shell while the initial route loads, then mount the resolved page.
  const initialPage = loadInitialRoute()
  renderApp(null, initialRoute)
  initialPage.then(
    ({ default: Page }) => renderApp(Page, initialRoute),
    (error) => renderApp(function InitialRouteLoadError() { throw error }, initialRoute),
  )
} else {
  renderApp()
}
