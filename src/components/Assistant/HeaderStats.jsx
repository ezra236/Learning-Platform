// HeaderStats.jsx
import React from "react";
import styles from "./HeaderStats.module.css";

export default function HeaderStats({ counts = { total: 0, active: 0, inactive: 0 } }) {
  return (
    <div className={styles.container}>
      <div className={styles.headerContent}>
        <div className={styles.titleSection}>
          <div className={styles.iconWrapper}>
            <i className="fas fa-users-gear"></i>
          </div>
          <div>
            <h1 className={styles.title}>Admin Assistants</h1>
            <p className={styles.subtitle}>Manage your team's administrative access and permissions</p>
          </div>
        </div>
        
        <div className={styles.statsGrid}>
          <div className={`${styles.statCard} ${styles.primary}`}>
            <div className={styles.statContent}>
              <div className={styles.statMain}>
                <div className={styles.statValue}>{counts.total}</div>
                <div className={styles.statLabel}>Total Assistants</div>
              </div>
              <div className={styles.statIcon}>
                <i className="fas fa-users"></i>
              </div>
            </div>
            <div className={styles.statTrend}>
              <i className="fas fa-chart-line"></i>
              <span>All team members</span>
            </div>
          </div>
          
          <div className={`${styles.statCard} ${styles.success}`}>
            <div className={styles.statContent}>
              <div className={styles.statMain}>
                <div className={styles.statValue}>{counts.active}</div>
                <div className={styles.statLabel}>Active Now</div>
              </div>
              <div className={styles.statIcon}>
                <i className="fas fa-user-check"></i>
              </div>
            </div>
            <div className={styles.statTrend}>
              <i className="fas fa-bolt"></i>
              <span>Currently active</span>
            </div>
          </div>
          
          <div className={`${styles.statCard} ${styles.warning}`}>
            <div className={styles.statContent}>
              <div className={styles.statMain}>
                <div className={styles.statValue}>{counts.inactive}</div>
                <div className={styles.statLabel}>Inactive</div>
              </div>
              <div className={styles.statIcon}>
                <i className="fas fa-user-clock"></i>
              </div>
            </div>
            <div className={styles.statTrend}>
              <i className="fas fa-pause"></i>
              <span>Awaiting activation</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}