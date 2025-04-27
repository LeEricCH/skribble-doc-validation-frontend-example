"use client";

export default function TrialBanner() {
  return (
    <div className="trial-banner">
      <div className="trial-banner-indicator" />
      <div className="trial-banner-content">
        <h3 className="trial-banner-title">Your free trial ends in <span className="trial-banner-days">14 days</span></h3>
        
        <p className="trial-banner-text">
          Convinced? Great! You don&apos;t have to wait until your trial ends. You can upgrade to the paid plan anytime.
        </p>

        <button 
          type="button"
          className="trial-banner-button"
        >
          Upgrade now
        </button>

        <div className="trial-banner-footer">
          <span className="trial-banner-footer-text">Questions?</span>
          <a href="/contact" className="trial-banner-footer-link">
            Contact us
          </a>
        </div>
      </div>
    </div>
  );
} 