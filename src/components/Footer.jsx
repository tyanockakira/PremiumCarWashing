import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="cinema-container footer__main">
        <div className="footer__brand">
          <div className="brand-lockup">
            <img src="/brand/mark.svg" alt="" width="70" height="46" />
            <span className="brand-lockup__wordmark">PREMIUMWASH</span>
          </div>
          <p className="footer__notice">Демонстраційна вітрина дітейлінгу</p>
        </div>
        <p className="footer__copyright">© {new Date().getFullYear()} PremiumWash</p>
      </div>
    </footer>
  );
}
