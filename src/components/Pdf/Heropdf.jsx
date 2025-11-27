"use client";

import React from "react";
import styles from './Hero.module.css';

const Heropdf = () => {
  const handleGetInstant = () => {
    const el = typeof document !== "undefined" ? document.getElementById("pdf-display") : null;
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      try { el.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
    } else if (typeof window !== "undefined") {
      // fallback: navigate to same page with hash
      window.location.href = `${window.location.pathname}#pdf-display`;
    }
  };

  return (
    <section className={styles.hero} aria-label="Hero section">
      <div className={styles.backgroundElements} aria-hidden>
        <div className={styles.circle1}></div>
        <div className={styles.circle2}></div>
        <div className={styles.circle3}></div>
      </div>

      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.badge}>
            🎓 Limited Time Offer - 50% OFF for New Students
          </div>

          <h1 className={styles.title}>
            <span className={styles.titleLine1}>Master Nursing with</span>
            <span className={styles.titleLine2}>Premium Study Guides</span>
          </h1>

          <p className={styles.subtitle}>
            Comprehensive PDF collections used by nursing students at top universities worldwide.
            <span className={styles.highlight}> Everything you need to excel in your exams.</span>
          </p>

          <ul className={styles.featureList}>
            <li className={styles.featureItem}>
              <span className={styles.icon}>📚</span>
              <div className={styles.featureText}>
                <span className={styles.featureTitle}>Complete Curriculum Coverage</span>
                <span className={styles.featureDesc}>All major nursing subjects and clinical procedures</span>
              </div>
            </li>
            <li className={styles.featureItem}>
              <span className={styles.icon}>⚡</span>
              <div className={styles.featureText}>
                <span className={styles.featureTitle}>Quick Study Methods</span>
                <span className={styles.featureDesc}>Visual aids, mnemonics, and memory techniques</span>
              </div>
            </li>
            <li className={styles.featureItem}>
              <span className={styles.icon}>🔄</span>
              <div className={styles.featureText}>
                <span className={styles.featureTitle}>Regular Updates</span>
                <span className={styles.featureDesc}>Always current with latest medical guidelines</span>
              </div>
            </li>
          </ul>

          <div className={styles.ctaSection}>
            <button
              className={styles.ctaButton}
              onClick={handleGetInstant}
              aria-label="Get instant access to PDFs"
            >
              <span className={styles.buttonIcon}>🛒</span>
              Get Instant Access Now
              <span className={styles.buttonArrow}>→</span>
            </button>

            <div className={styles.guarantee}>
              <span className={styles.guaranteeIcon}>✅</span>
              <span>30-Day Money Back Guarantee • Instant Digital Delivery</span>
            </div>

            <div className={styles.trustBadges}>
              <div className={styles.trustItem}>🔒 Secure Checkout</div>
              <div className={styles.trustItem}>💳 Multiple Payments</div>
              <div className={styles.trustItem}>📧 24/7 Support</div>
            </div>
          </div>
        </div>

        <div className={styles.imageSection}>
          <div className={styles.imageContainer}>
            <img
              src="/fm.jpg"
              alt="Nursing Study Guides - NCLEX Preparation Materials"
              className={styles.heroImage}
            />
            <div className={styles.imageBadge}>
              <span className={styles.badgeIcon}>⭐</span>
              Most Popular 2024
            </div>
          </div>

          <div className={styles.reviewCard}>
            <div className={styles.reviewHeader}>
              <div className={styles.reviewStars}>★★★★★</div>
              <div className={styles.reviewRating}>5.0/5.0</div>
            </div>
            <p className={styles.reviewText}>
              "These PDFs helped me ace my NCLEX on first attempt! The clinical guides are incredibly detailed."
            </p>
            <div className={styles.reviewAuthor}>
              <span className={styles.authorName}>Sarah Johnson, RN</span>
              <span className={styles.authorCred}>Graduated Magna Cum Laude</span>
            </div>
          </div>

          <div className={styles.featureHighlights}>
            <div className={styles.featureHighlight}>
              <span className={styles.highlightIcon}>📱</span>
              <span>Mobile Friendly</span>
            </div>
            <div className={styles.featureHighlight}>
              <span className={styles.highlightIcon}>🖨️</span>
              <span>Printable</span>
            </div>
            <div className={styles.featureHighlight}>
              <span className={styles.highlightIcon}>🔍</span>
              <span>Searchable</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Heropdf;
