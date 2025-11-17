import React from 'react';
import styles from './ContactPage.module.css';

const ContactHero = () => {
  return (
    <section className={styles.contactHero}>
      <div className={styles.heroBackground}>
        <div className={styles.heroOrb}></div>
        <div className={styles.heroWave}></div>
      </div>
      
      <div className={styles.heroContainer}>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            🩺 Nursing Exam Support
          </div>
          <h1 className={styles.heroTitle}>
            We're Here to Help You 
            <span className={styles.titleAccent}> Succeed</span>
          </h1>
          <p className={styles.heroDescription}>
            Get personalized support for ATI TEAS 7, NCLEX, and nursing test banks. 
            Our team is dedicated to helping you achieve your nursing career goals.
          </p>
          
          <div className={styles.heroStats}>
            <div className={styles.statItem}>
              <div className={styles.statNumber}>24/7</div>
              <div className={styles.statLabel}>Support Available</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statNumber}>1000+</div>
              <div className={styles.statLabel}>Students Helped</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statNumber}>15min</div>
              <div className={styles.statLabel}>Avg Response</div>
            </div>
          </div>
        </div>
        
        <div className={styles.heroVisual}>
          <div className={styles.visualCard}>
            <div className={styles.cardIcon}>📚</div>
            <div className={styles.cardText}>ATI TEAS 7</div>
          </div>
          <div className={styles.visualCard}>
            <div className={styles.cardIcon}>🩺</div>
            <div className={styles.cardText}>NCLEX Prep</div>
          </div>
          <div className={styles.visualCard}>
            <div className={styles.cardIcon}>📖</div>
            <div className={styles.cardText}>Test Banks</div>
          </div>
          <div className={styles.visualPulse}></div>
        </div>
      </div>
    </section>
  );
};

export default ContactHero;