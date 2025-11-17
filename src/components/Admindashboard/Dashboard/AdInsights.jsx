import React from 'react';
import styles from './insights.module.css';

export default function AdInsights() {
  return (
    <a href="/admin/insights/" className={styles.container}>
      <div className={styles.backgroundPattern}></div>
      <div className={styles.content}>
        <div className={styles.iconSection}>
          <div className={styles.iconContainer}>
            <span className={styles.icon}>🧠</span>
          </div>
          <div className={styles.iconGlow}></div>
        </div>
        
        <div className={styles.textSection}>
          <h3 className={styles.title}>See Announcement and Campaign Insights</h3>
          <p className={styles.description}>
            See views and capaigns perfomance
          </p>
          <div className={styles.features}>
            <span className={styles.feature}>Rich Text Editor</span>
            <span className={styles.feature}>Audience Targeting</span>
            <span className={styles.feature}>Scheduling</span>
            <span className={styles.feature}>Analytics</span>
          </div>
        </div>
        
        <div className={styles.ctaSection}>
          <span className={styles.ctaText}>Compose Message</span>
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