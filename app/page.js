"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// =====================================================================
//  CLIENT CONFIGURATION (KSP Self Drive Cars and Rentals)
// =====================================================================

// Client's exact Google Place ID (Please replace this if you have the exact ChIJ ID, otherwise leave blank or generate via search URL)
// For now, this search query URL works perfectly for Google Reviews.
const GOOGLE_REVIEW_URL = "https://search.google.com/local/writereview?placeid=ChIJY2tW_5HwXDsRTR31L3iOtwM"; 
// Note: If you have the exact Place ID, replace the URL above. For now, it will open the review box for KSP Wagholi.

const CLIENT_CONFIG = {
  businessName: "KSP Self Drive Cars",
  subHeading: "Premium Car Rental • Pune & Wagholi",
  tagline: "SELF DRIVE CARS • DOORSTEP DELIVERY • HATCHBACKS TO SUVS",
  description: "Customer-rated self-drive car rental agency based in Wagholi, Pune. We provide clean, well-maintained cars like Swift, Fortuner, Innova with instant refund and zero hidden charges.",
  city: "Wagholi, Pune, Maharashtra 412207",
  areaLabel: "Wagholi, Pune",
  fullAddress: "Purvarang society, Bawadi Rd, near Sanskriti School, Wagholi, Pune, Maharashtra 412207",
  phone: "+917470431373",
  cleanPhone: "917470431373",
  logoUrl: "/logo.png",

  googleReviewUrl: "https://search.google.com/local/writereview?placeid=YOUR_PLACE_ID_HERE", // Replace YOUR_PLACE_ID_HERE with real ID, or use the link above
  mapsDirectionUrl: "https://www.google.com/maps/dir/?api=1&destination=KSP+self+drive+cars+and+rentals+Wagholi+Pune",

  instagramUrl: "", // Add if client has one
  facebookUrl: "",
  youtubeUrl: "",
  websiteUrl: "https://www.kspselfdrivecars.in/",

  agencyName: "VR Max AI",
  agencyWhatsapp: "918700660097",
  agencyPhoneDisplay: "+91 87006 60097",

  // Must match exactly with the route.js CHIPS keys
  chips: [
    'Clean & Maintained',
    'Doorstep Delivery',
    'Smooth Booking',
    'Affordable Pricing',
    'Instant Refund',
    'Polite Staff',
    'Outstation Trips',
    'No Hidden Charges'
  ],
};

const HAS_SOCIAL = !!(CLIENT_CONFIG.instagramUrl || CLIENT_CONFIG.facebookUrl || CLIENT_CONFIG.youtubeUrl || CLIENT_CONFIG.websiteUrl);

const MAP_EMBED_URL = `https://www.google.com/maps?q=${encodeURIComponent(
  `${CLIENT_CONFIG.businessName}, ${CLIENT_CONFIG.fullAddress}`
)}&output=embed`;

const AGENCY_WA_LINK = `https://wa.me/${CLIENT_CONFIG.agencyWhatsapp}?text=${encodeURIComponent(
  "Hi VR Max AI, I want to get a QR review system for my business."
)}`;

function useTypewriter(fullText, speed = 10) {
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!fullText) {
      setDisplayText("");
      setIsTyping(false);
      return;
    }
    setDisplayText("");
    setIsTyping(true);
    let index = 0;
    const timer = setInterval(() => {
      index++;
      setDisplayText(fullText.slice(0, index));
      if (index >= fullText.length) {
        clearInterval(timer);
        setIsTyping(false);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [fullText, speed]);

  return { displayText, isTyping };
}

async function copyToClipboard(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {}
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch (e) {
    return false;
  }
}

export default function RentalReviewPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedChips, setSelectedChips] = useState([]);
  
  // Default Language Set to Marathi as per Pune location and your strict rules
  const [language, setLanguage] = useState("MARATHI"); 
  
  const [reviewDraft, setReviewDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const abortControllerRef = useRef(null);
  const requestIdRef = useRef(0);
  const recentLengthsRef = useRef([]);
  const { displayText, isTyping } = useTypewriter(reviewDraft, 10);

  useEffect(() => {
    setMounted(true);
    return () => {
      requestIdRef.current++;
      abortControllerRef.current?.abort();
    };
  }, []);

  const generateAIReview = useCallback(async (chipsToUse, lang) => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const requestId = ++requestIdRef.current;

    setLoading(true);
    setCopied(false);
    setError("");
    setReviewDraft("");

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          businessName: CLIENT_CONFIG.businessName,
          category: CLIENT_CONFIG.tagline,
          description: CLIENT_CONFIG.description,
          city: CLIENT_CONFIG.city,
          selectedChips: chipsToUse,
          language: lang,
          nonce: Math.random().toString(36).substring(2, 12),
          timestamp: Date.now(),
          recentLengths: recentLengthsRef.current,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Draft generation failed (${res.status}).`);
      if (!data.review?.trim()) throw new Error("The API returned an empty draft.");
      if (requestId !== requestIdRef.current) return;

      if (data.meta) {
        recentLengthsRef.current = [...recentLengthsRef.current, data.meta].slice(-6);
      }
      setReviewDraft(data.review.trim());
    } catch (err) {
      if (err.name === "AbortError") return;
      if (requestId === requestIdRef.current) {
        setError(err.message || "Unable to generate a draft.");
      }
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    generateAIReview(selectedChips, language);
    return () => abortControllerRef.current?.abort();
  }, [mounted, selectedChips, language, generateAIReview]);

  function toggleChip(chip) {
    let updated;
    if (selectedChips.includes(chip)) {
      updated = selectedChips.filter((c) => c !== chip);
    } else {
      if (selectedChips.length >= 3) {
        alert("तुम्ही जास्तीत जास्त ३ पर्याय निवडू शकता."); // Marathi alert
        return;
      }
      updated = [...selectedChips, chip];
    }
    setSelectedChips(updated);
  }

  function handleLanguageChange(lang) {
    if (lang === language) {
      generateAIReview(selectedChips, lang);
      return;
    }
    setLanguage(lang);
  }

  async function handleCopyAndRedirect() {
    if (!reviewDraft || loading || isTyping) return;
    const ok = await copyToClipboard(reviewDraft);
    if (!ok) {
      setError("Could not copy the draft. Please select and copy it manually.");
      return;
    }
    setCopied(true);
    setTimeout(() => {
      // Use the fallback URL if Place ID is not updated in code
      window.location.href = CLIENT_CONFIG.googleReviewUrl.includes("YOUR_PLACE_ID") ? GOOGLE_REVIEW_URL : CLIENT_CONFIG.googleReviewUrl;
    }, 550);
  }

  function handleSaveContact() {
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${CLIENT_CONFIG.businessName}
ORG:${CLIENT_CONFIG.businessName}
TEL;TYPE=CELL:${CLIENT_CONFIG.phone}
ADR;TYPE=WORK:;;${CLIENT_CONFIG.fullAddress};;;;
NOTE:${CLIENT_CONFIG.subHeading}
END:VCARD`;

    const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${CLIENT_CONFIG.businessName.replace(/\s+/g, "_")}.vcf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  if (!mounted) return <div style={{ minHeight: "100vh", backgroundColor: "#0f172a" }} />;

  return (
    <main className="rental-glass-viewport">
      {/* BULLETPROOF FIXED BACKGROUND */}
      <div className="fixed-bg"></div>

      <div className="main-content-flow">
        
        {/* Logo */}
        <div className="brand-medallion-badge">
          <div
            className="logo-circle-container"
            style={{ backgroundImage: `url(${CLIENT_CONFIG.logoUrl})` }}
            role="img"
            aria-label={`${CLIENT_CONFIG.businessName} logo`}
          ></div>
          <h1 className="brand-main-title">{CLIENT_CONFIG.businessName}</h1>
        </div>

        <p className="brand-serif-subtitle">{CLIENT_CONFIG.subHeading}</p>

        <div className="rental-divider">
          <span className="divider-line"></span>
          <span className="divider-icon">🚘</span>
          <span className="divider-line"></span>
        </div>

        <div className="stars-cluster" aria-hidden="true">
          <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
        </div>

        <p className="experience-tracker-title">तुमचा अनुभव शेअर करा</p>

        {/* Filter Chips */}
        <div className="floating-pills-cloud">
          {CLIENT_CONFIG.chips.map((chip) => {
            const active = selectedChips.includes(chip);
            return (
              <button
                key={chip}
                type="button"
                onClick={() => toggleChip(chip)}
                className={`embossed-pill ${active ? "active" : ""}`}
              >
                {chip} {active && "✓"}
              </button>
            );
          })}
        </div>
        <p className="chip-hint">Select up to 3 points</p>

        {/* Language Selector */}
        <div className="capsule-lang-dock">
          {["MARATHI", "ENGLISH", "HINDI"].map((lang) => {
            const active = language === lang;
            return (
              <button
                key={lang}
                type="button"
                onClick={() => handleLanguageChange(lang)}
                className={`capsule-lang-btn ${active ? "active" : ""}`}
              >
                {lang}
              </button>
            );
          })}
        </div>

        {/* Review Box (Glassmorphism) */}
        <div className="signature-review-box glass-panel">
          <div className="box-top-ribbon">
            <div className="label-badge">
              <span className="dot-ping"></span>
              YOUR REVIEW
            </div>
            <button
              type="button"
              disabled={loading || isTyping}
              onClick={() => generateAIReview(selectedChips, language)}
              className="top-rewrite-btn"
            >
              <span>Rewrite</span>
            </button>
          </div>

          <div className="review-display-zone">
            {loading ? (
              <div className="loader-shimmer-wrap">
                <span className="sparkle-icon">✦</span>
                <span className="shimmer-text"> Crafting authentic review...</span>
              </div>
            ) : error ? (
              <p className="review-error">{error}</p>
            ) : reviewDraft ? (
              <p className="review-body-text">
                {displayText}
                {isTyping && <span className="typewriter-cursor"></span>}
              </p>
            ) : (
              <p className="review-placeholder">Your review draft will appear here.</p>
            )}
          </div>

          <div className="card-ornament-center"><span>🚘</span></div>

          <button
            type="button"
            disabled={loading || isTyping || !reviewDraft}
            onClick={handleCopyAndRedirect}
            className="full-luxury-copy-btn"
          >
            <span>{copied ? "Copied! Opening Google..." : "Copy & Paste on Google"}</span>
          </button>
          <p className="card-disclaimer-note">Please review the wording before posting.</p>
        </div>

        {/* Quick Actions (Glassmorphism) */}
        <div className="quick-actions-card glass-panel">
          <div className="soft-action-grid">
            <div className="action-row-upper">
              {/* WhatsApp */}
              <a href={`https://wa.me/${CLIENT_CONFIG.cleanPhone}`} target="_blank" rel="noreferrer" className="soft-circle-action">
                <div className="icon-disc whatsapp-disc">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                </div>
                <span className="icon-tag">WhatsApp</span>
              </a>

              {/* Call Us */}
              <a href={`tel:${CLIENT_CONFIG.phone}`} className="soft-circle-action">
                <div className="icon-disc call-disc">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                </div>
                <span className="icon-tag">Call Us</span>
              </a>

              {/* Save Contact */}
              <button type="button" onClick={handleSaveContact} className="soft-circle-action">
                <div className="icon-disc contact-disc">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                </div>
                <span className="icon-tag">Save Contact</span>
              </button>

              {/* Directions */}
              <a href={CLIENT_CONFIG.mapsDirectionUrl} target="_blank" rel="noreferrer" className="soft-circle-action">
                <div className="icon-disc map-disc">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
                <span className="icon-tag">Directions</span>
              </a>
            </div>

            <div className="action-row-lower" style={HAS_SOCIAL ? undefined : { display: "none" }}>
              {CLIENT_CONFIG.websiteUrl && (
                <a href={CLIENT_CONFIG.websiteUrl} target="_blank" rel="noreferrer" className="soft-circle-action">
                  <div className="icon-disc web-disc">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                  </div>
                  <span className="icon-tag">Website</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Map Card (Glassmorphism) */}
        <div className="embedded-map-card glass-panel">
          <a href={CLIENT_CONFIG.mapsDirectionUrl} target="_blank" rel="noreferrer" className="map-card-header-link">
            <div className="address-highlight-box">
              <p className="agency-clean-address"><strong>📍 Location:</strong> {CLIENT_CONFIG.fullAddress}</p>
            </div>
            <div className="map-card-header">
              <span>Visit Us • {CLIENT_CONFIG.areaLabel}</span>
            </div>
          </a>
          <div className="map-iframe-container">
            <iframe
              title={`${CLIENT_CONFIG.businessName} Location`}
              src={MAP_EMBED_URL}
              width="100%"
              height="170"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <a
            href={CLIENT_CONFIG.mapsDirectionUrl}
            target="_blank"
            rel="noreferrer"
            className="map-directions-link"
          >
            Get Directions on Google Maps &rarr;
          </a>
        </div>

        {/* Mini Footer */}
        <footer className="mini-footer">
          <span className="mini-footer-pill glass-panel">
            Powered by <strong>{CLIENT_CONFIG.agencyName}</strong>
            <span className="mini-footer-dot">•</span>
            Get QR:
            <a href={AGENCY_WA_LINK} target="_blank" rel="noreferrer">
              {CLIENT_CONFIG.agencyPhoneDisplay}
            </a>
          </span>
        </footer>
      </div>

      <style jsx global>{`
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background-color: #0f172a !important; 
          min-height: 100% !important;
        }

        .rental-glass-viewport {
          position: relative; 
          --tx-main: #f8fafc;     
          --tx-sub: #cbd5e1;      
          --brand-primary: #f59e0b; /* Amber/Yellow for Cars */
          --brand-dark: #1e293b; 
          --glass-bg: rgba(15, 23, 42, 0.75); 
          --glass-border: rgba(255, 255, 255, 0.15);
          --glass-shadow: rgba(0, 0, 0, 0.4);

          min-height: 100vh;
          background-color: transparent; 
          padding: 10px 16px 24px;
          box-sizing: border-box;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: var(--tx-main);
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        /* FIXED BACKGROUND */
        .fixed-bg {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background-image: url('/bg.png'); 
          background-size: cover;
          background-position: center bottom; 
          background-repeat: no-repeat;
          z-index: 0; 
          pointer-events: none;
        }

        .main-content-flow {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 410px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .glass-panel {
          background: var(--glass-bg);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid var(--glass-border);
          box-shadow: 0 8px 32px var(--glass-shadow);
        }

        .brand-medallion-badge {
          margin-top: 12px;
          margin-bottom: 6px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .logo-circle-container {
          width: 110px;
          height: 110px;
          border-radius: 50%;
          background-color: #ffffff;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          box-shadow: 0 10px 25px rgba(245, 158, 11, 0.3);
          margin-bottom: 12px;
          animation: floatLogo 3.5s ease-in-out infinite;
          border: 3px solid var(--brand-primary);
        }

        @keyframes floatLogo {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }

        .brand-main-title {
          font-family: Georgia, serif;
          font-size: 26px;
          font-weight: 800;
          color: var(--tx-main);
          margin: 0 0 4px;
          letter-spacing: 0.3px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.8);
        }

        .brand-serif-subtitle {
          font-family: Georgia, serif;
          font-style: italic;
          font-size: 13.5px;
          color: var(--brand-primary);
          margin: 0 0 10px;
          text-shadow: 0 1px 3px rgba(0,0,0,0.8);
        }

        .rental-divider {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 85%;
          margin: 4px auto 12px;
          gap: 10px;
        }

        .divider-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--brand-primary), transparent);
          opacity: 0.5;
        }

        .divider-icon {
          font-size: 14px;
          opacity: 0.9;
        }

        .stars-cluster {
          display: flex;
          gap: 4px;
          color: var(--brand-primary);
          font-size: 16px;
          margin-bottom: 4px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.8);
        }

        .experience-tracker-title {
          font-size: 9.5px;
          font-weight: 800;
          letter-spacing: 2px;
          color: var(--tx-main);
          text-transform: uppercase;
          margin: 0 0 6px;
          text-shadow: 0 1px 3px rgba(0,0,0,0.8);
        }
        
        .chip-hint {
          font-size: 10px;
          color: var(--tx-sub);
          margin: 0 0 12px;
          opacity: 0.9;
          text-shadow: 0 1px 2px rgba(0,0,0,0.8);
        }

        .floating-pills-cloud {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 6px;
          margin-bottom: 6px;
          width: 100%;
        }

        .embossed-pill {
          border-radius: 999px;
          padding: 6px 14px;
          font-size: 11px;
          background: var(--glass-bg);
          backdrop-filter: blur(8px);
          color: var(--tx-sub);
          border: 1px solid var(--glass-border);
          cursor: pointer;
          box-shadow: 0 2px 8px var(--glass-shadow);
          transition: all 0.2s ease;
        }

        .embossed-pill:active { transform: scale(0.95); }

        .embossed-pill.active {
          background: var(--brand-primary);
          color: #0f172a;
          font-weight: 700;
          border-color: var(--brand-primary);
          box-shadow: 0 4px 14px rgba(245, 158, 11, 0.4);
        }

        .capsule-lang-dock {
          display: inline-flex;
          background: var(--glass-bg);
          backdrop-filter: blur(8px);
          border-radius: 999px;
          padding: 3px;
          gap: 2px;
          margin-bottom: 16px;
          box-shadow: 0 3px 10px var(--glass-shadow);
          border: 1px solid var(--glass-border);
        }

        .capsule-lang-btn {
          padding: 5px 14px;
          border-radius: 999px;
          border: none;
          background: transparent;
          font-size: 10px;
          font-weight: 700;
          color: var(--tx-sub);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .capsule-lang-btn.active {
          background: #ffffff;
          color: #0f172a;
          box-shadow: 0 3px 8px rgba(255, 255, 255, 0.3);
        }

        .signature-review-box {
          width: 100%;
          border-radius: 24px;
          padding: 18px;
          box-sizing: border-box;
          margin-bottom: 16px;
          text-align: left;
          border-top: 4px solid var(--brand-primary);
        }

        .box-top-ribbon {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .label-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 8.5px;
          font-weight: 800;
          letter-spacing: 1.8px;
          color: var(--tx-sub);
          text-transform: uppercase;
        }

        .dot-ping {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--brand-primary);
        }

        .top-rewrite-btn {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255,255,255,0.2);
          color: #ffffff;
          font-size: 10.5px;
          font-weight: 650;
          cursor: pointer;
        }

        .review-display-zone {
          min-height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px 2px 8px;
        }

        .loader-shimmer-wrap {
          color: var(--brand-primary);
          font-size: 12px;
          font-style: italic;
        }

        .review-body-text {
          font-family: Georgia, serif;
          font-size: 14.5px;
          line-height: 1.6;
          color: var(--tx-main);
          margin: 0;
          width: 100%;
          white-space: pre-wrap;
        }

        .review-placeholder {
          font-family: Georgia, serif;
          font-size: 13px;
          font-style: italic;
          color: #94a3b8;
          margin: 0;
        }

        .review-error {
          font-size: 12px;
          color: #ef4444;
          margin: 0;
        }

        .typewriter-cursor {
          display: inline-block;
          width: 2px;
          height: 13px;
          background: var(--brand-primary);
          margin-left: 3px;
          vertical-align: middle;
          animation: blink 0.7s infinite;
        }

        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

        .card-ornament-center {
          text-align: center;
          font-size: 14px;
          margin: 6px 0 10px;
          opacity: 0.8;
        }

        .full-luxury-copy-btn {
          width: 100%;
          height: 50px;
          border-radius: 999px;
          background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%);
          border: none;
          color: #0f172a;
          font-size: 12.5px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 8px 22px rgba(245, 158, 11, 0.3);
          transition: transform 0.15s ease;
        }

        .full-luxury-copy-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .full-luxury-copy-btn:active:not(:disabled) { transform: scale(0.98); }

        .card-disclaimer-note {
          font-size: 9.5px;
          color: var(--tx-sub);
          text-align: center;
          margin: 8px 0 0;
          font-style: italic;
        }

        .quick-actions-card {
          width: 100%;
          border-radius: 22px;
          padding: 18px 12px;
          box-sizing: border-box;
          margin-bottom: 16px;
        }

        .soft-action-grid {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          width: 100%;
        }

        .action-row-upper, .action-row-lower {
          display: flex;
          justify-content: center;
          gap: 14px;
          width: 100%;
        }

        .soft-circle-action {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
          text-decoration: none !important;
          color: var(--tx-sub);
          background: transparent;
          border: none;
          cursor: pointer;
          transition: transform 0.15s ease;
        }

        .soft-circle-action:active { transform: scale(0.92); }

        .icon-disc {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          display: grid;
          place-items: center;
          box-shadow: 0 4px 12px var(--glass-shadow);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.2s ease;
        }

        .icon-disc svg {
          width: 20px;
          height: 20px;
          stroke: #ffffff;
          transition: stroke 0.2s ease;
        }

        .whatsapp-disc:hover { background: #25d366; border-color: #25d366; }
        .call-disc:hover { background: #007aff; border-color: #007aff; }
        .contact-disc:hover { background: var(--brand-primary); border-color: var(--brand-primary); }
        .contact-disc:hover svg { stroke: #0f172a; }
        .map-disc:hover { background: #ea4335; border-color: #ea4335; }
        .web-disc:hover { background: var(--brand-primary); border-color: var(--brand-primary); }
        .web-disc:hover svg { stroke: #0f172a; }

        .icon-tag {
          font-size: 9.5px;
          font-weight: 700;
          color: var(--tx-main);
        }

        .embedded-map-card {
          width: 100%;
          border-radius: 22px;
          padding: 14px 16px;
          box-sizing: border-box;
          margin-bottom: 12px;
          text-align: left;
        }

        .map-card-header-link { text-decoration: none; }
        .map-card-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 11.5px;
          font-weight: 800;
          color: var(--brand-primary);
          margin-bottom: 8px;
        }

        .map-iframe-container {
          width: 100%;
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid var(--glass-border);
          margin-bottom: 8px;
        }

        .map-directions-link {
          font-size: 11px;
          font-weight: 750;
          color: var(--brand-primary);
          text-decoration: none;
          display: block;
          text-align: center;
          margin-bottom: 8px;
        }

        .address-highlight-box {
          background: rgba(255,255,255,0.05);
          border-radius: 12px;
          padding: 10px 12px;
          border: 1px solid rgba(255,255,255,0.1);
          margin-bottom: 8px;
        }

        .agency-clean-address {
          font-size: 10.5px;
          color: var(--tx-sub);
          margin: 0;
          line-height: 1.4;
          text-align: center;
        }

        .mini-footer {
          width: 100%;
          display: flex;
          justify-content: center;
          margin-top: 2px;
        }

        .mini-footer-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 4px;
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 8.5px;
          letter-spacing: 0.3px;
          color: var(--tx-sub);
          line-height: 1.4;
        }

        .mini-footer-pill strong { color: var(--tx-main); font-weight: 700; }
        .mini-footer-dot { color: var(--brand-primary); }
        .mini-footer-pill a { color: var(--brand-primary); font-weight: 700; text-decoration: none; }
      `}</style>
    </main>
  );
}
