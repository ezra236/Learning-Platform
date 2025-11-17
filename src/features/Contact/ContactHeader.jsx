import React from 'react';
import styles from './ContactPage.module.css';

const ContactHeader = () => {
  return (
    <header className={styles.contactHeader}>
      <div className={styles.headerBackground}></div>
      <div className={styles.headerContent}>
        <div className={styles.titleContainer}>
          <h1 className={styles.mainTitle}>
            Get in <span className={styles.highlight}>Touch</span>
          </h1>
          <div className={styles.titleUnderline}></div>
        </div>
        <p className={styles.subtitle}>
          🩺 Your success in nursing exams is our mission. 
          Reach out for support with <strong>ATI TEAS 7</strong>, <strong>NCLEX</strong>, 
          and <strong>nursing test banks</strong>.
        </p>
        <div className={styles.platformBadges}>
          <span className={styles.badge}>ATI TEAS 7</span>
          <span className={styles.badge}>NCLEX</span>
          <span className={styles.badge}>Test Banks</span>
        </div>
        <div className={styles.decoration}>
          <span className={styles.decoCircle}></span>
          <span className={styles.decoSquare}></span>
          <span className={styles.decoTriangle}></span>
          <span className={styles.decoPulse}></span>
        </div>
      </div>
    </header>
  );
};

export default ContactHeader;