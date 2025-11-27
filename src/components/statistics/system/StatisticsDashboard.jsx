// components/StatisticsDashboard.js
import { useState } from 'react';
import styles from './StatisticsDashboard.module.css';
import TotalRegistered from './TotalRegistered';
import TodaySignedIn from './TodaySignedIn';
import TodayPayments from './TodayPayments';

const StatisticsDashboard = () => {
  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1 className={styles.title}>Rushhourcamp Analytics</h1>
        <p className={styles.subtitle}>Real-time statistics and insights</p>
      </div>
      
      <div className={styles.grid}>
        <div className={styles.gridItem}>
          <TotalRegistered />
        </div>
        <div className={styles.gridItem}>
          <TodaySignedIn />
        </div>
        <div className={styles.gridItem}>
          <TodayPayments />
        </div>
      </div>
    </div>
  );
};

export default StatisticsDashboard;