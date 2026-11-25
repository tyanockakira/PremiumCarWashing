import bookingHeadlight from '../assets/premiumwash/booking-headlight.webp';
import bookingHeadlight480 from '../assets/premiumwash/responsive/booking-headlight-480.webp';
import bookingHeadlight768 from '../assets/premiumwash/responsive/booking-headlight-768.webp';
import bookingHeadlight1200 from '../assets/premiumwash/responsive/booking-headlight-1200.webp';
import ceramic from '../assets/premiumwash/ceramic.webp';
import ceramic480 from '../assets/premiumwash/responsive/ceramic-480.webp';
import ceramic768 from '../assets/premiumwash/responsive/ceramic-768.webp';
import ceramic1200 from '../assets/premiumwash/responsive/ceramic-1200.webp';
import contactsRear from '../assets/premiumwash/contacts-rear.webp';
import contactsRear480 from '../assets/premiumwash/responsive/contacts-rear-480.webp';
import contactsRear768 from '../assets/premiumwash/responsive/contacts-rear-768.webp';
import contactsRear1200 from '../assets/premiumwash/responsive/contacts-rear-1200.webp';
import heroAlternative from '../assets/premiumwash/hero-alternative.webp';
import heroAlternative480 from '../assets/premiumwash/responsive/hero-alternative-480.webp';
import heroAlternative768 from '../assets/premiumwash/responsive/hero-alternative-768.webp';
import heroAlternative1200 from '../assets/premiumwash/responsive/hero-alternative-1200.webp';
import inspection from '../assets/premiumwash/inspection.webp';
import inspection480 from '../assets/premiumwash/responsive/inspection-480.webp';
import inspection768 from '../assets/premiumwash/responsive/inspection-768.webp';
import inspection1200 from '../assets/premiumwash/responsive/inspection-1200.webp';
import interior from '../assets/premiumwash/interior.webp';
import interior480 from '../assets/premiumwash/responsive/interior-480.webp';
import interior768 from '../assets/premiumwash/responsive/interior-768.webp';
import interior1200 from '../assets/premiumwash/responsive/interior-1200.webp';
import polishing from '../assets/premiumwash/polishing.webp';
import polishing480 from '../assets/premiumwash/responsive/polishing-480.webp';
import polishing768 from '../assets/premiumwash/responsive/polishing-768.webp';
import polishing1200 from '../assets/premiumwash/responsive/polishing-1200.webp';
import ppf from '../assets/premiumwash/ppf.webp';
import ppf480 from '../assets/premiumwash/responsive/ppf-480.webp';
import ppf768 from '../assets/premiumwash/responsive/ppf-768.webp';
import ppf1200 from '../assets/premiumwash/responsive/ppf-1200.webp';

function set(source, small, medium, large) {
  return {
    source,
    srcSet: `${small} 480w, ${medium} 768w, ${large} 1200w`,
    mobileSrcSet: `${small} 1x, ${medium} 2x, ${large} 3x`,
    tabletSrcSet: `${medium} 1x, ${large} 2x, ${large} 3x`,
  };
}

const imageSets = [
  set(bookingHeadlight, bookingHeadlight480, bookingHeadlight768, bookingHeadlight1200),
  set(ceramic, ceramic480, ceramic768, ceramic1200),
  set(contactsRear, contactsRear480, contactsRear768, contactsRear1200),
  set(heroAlternative, heroAlternative480, heroAlternative768, heroAlternative1200),
  set(inspection, inspection480, inspection768, inspection1200),
  set(interior, interior480, interior768, interior1200),
  set(polishing, polishing480, polishing768, polishing1200),
  set(ppf, ppf480, ppf768, ppf1200),
];

export function getResponsiveImage(source) {
  return imageSets.find((image) => image.source === source);
}

export const responsiveImages = {
  bookingHeadlight: imageSets[0],
  ceramic: imageSets[1],
  contactsRear: imageSets[2],
  heroAlternative: imageSets[3],
  inspection: imageSets[4],
  interior: imageSets[5],
  polishing: imageSets[6],
  ppf: imageSets[7],
};

export const heroImageSizes = '(max-width: 850px) calc(100vw - 40px), min(50.5vw, 888px)';
