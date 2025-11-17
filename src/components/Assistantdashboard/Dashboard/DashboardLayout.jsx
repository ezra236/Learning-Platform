import React from 'react';
import styles from './DashboardLayout.module.css';

export default function DashboardLayout({ children }) {
  return (
    <div className={styles.dashboardLayout}>
      <div className={styles.layoutBackground}></div>
      <div className={styles.layoutContainer}>
        {children}
      </div>
    </div>
  );
}