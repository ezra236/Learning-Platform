import React from 'react';
import styles from './CreateCampaignLink.module.css';

export default function CreateCampaignLink() {
  return (
    <a href="/admin/campaign/" className={styles.container}>
      <div className={styles.backgroundPattern}></div>
      <div className={styles.content}>
        <div className={styles.iconSection}>
          <div className={styles.iconContainer}>
            <span className={styles.icon}>🎪</span>
          </div>
          <div className={styles.iconGlow}></div>
        </div>
        
        <div className={styles.textSection}>
          <h3 className={styles.title}>Create Campaign</h3>
          <p className={styles.description}>
            Launch marketing campaigns with targeted messaging, audience segmentation, 
            and comprehensive analytics to maximize engagement and conversions.
          </p>
          <div className={styles.features}>
            <span className={styles.feature}>Audience Targeting</span>
            <span className={styles.feature}>A/B Testing</span>
            <span className={styles.feature}>Analytics</span>
          </div>
        </div>
        
        <div className={styles.ctaSection}>
          <span className={styles.ctaText}>Launch Campaign</span>
          <div className={styles.ctaArrow}>
            <span className={styles.arrow}>→</span>
            <span className={styles.arrowHover}>→</span>
          </div>
        </div>
      </div>
      
      <div className={styles.hoverEffect}></div>
    </a>
  );
}