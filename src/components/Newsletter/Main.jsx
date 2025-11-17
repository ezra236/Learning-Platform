import React from 'react';
import LeftSection from './LeftSection';
import RightSection from './RightSection';
import styles from './Main.module.css';

const Main = () => {
  return (
    <div className={styles.mainContainer}>
      <div className={styles.header}>
        <h1>📧 Newsletter Management Dashboard</h1>
        <p>Manage your subscribers and send beautiful emails</p>
      </div>
      <div className={styles.content}>
        <div className={styles.leftSection}>
          <LeftSection />
        </div>
        <div className={styles.rightSection}>
          <RightSection />
        </div>
      </div>
    </div>
  );
};

export default Main;