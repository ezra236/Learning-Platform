// components/subscriptions/SubscribersStats.jsx
import React from "react";
import styles from "./SubscribersStats.module.css";

export default function SubscribersStats({ total = 0, active = 0, expired = 0 }) {
  return (
    <div className={styles.container}>
      <div className={styles.statCard}>
        <div className={styles.cardBackground}></div>
        <div className={styles.cardContent}>
          <div className={styles.iconWrapper}>
            <span className={styles.icon}>👥</span>
          </div>
          <div className={styles.textContent}>
            <div className={styles.value}>{total.toLocaleString()}</div>
            <div className={styles.label}>Total Subscribers</div>
            <div className={styles.trend}>All Time</div>
          </div>
        </div>
      </div>
      
      <div className={`${styles.statCard} ${styles.active}`}>
        <div className={styles.cardBackground}></div>
        <div className={styles.cardContent}>
          <div className={styles.iconWrapper}>
            <span className={styles.icon}>✅</span>
          </div>
          <div className={styles.textContent}>
            <div className={styles.value}>{active.toLocaleString()}</div>
            <div className={styles.label}>Active</div>
            <div className={styles.trend}>Currently Active</div>
          </div>
        </div>
      </div>
      
      <div className={`${styles.statCard} ${styles.expired}`}>
        <div className={styles.cardBackground}></div>
        <div className={styles.cardContent}>
          <div className={styles.iconWrapper}>
            <span className={styles.icon}>⏰</span>
          </div>
          <div className={styles.textContent}>
            <div className={styles.value}>{expired.toLocaleString()}</div>
            <div className={styles.label}>Expired</div>
            <div className={styles.trend}>Need Renewal</div>
          </div>
        </div>
      </div>
    </div>
  );
}