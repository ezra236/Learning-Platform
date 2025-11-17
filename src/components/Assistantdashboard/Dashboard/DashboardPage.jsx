import React from 'react';
import DashboardHeader from './DashboardHeader';
import CreateExamLinks from './CreateExamLinks';
import ModifyExamLinks from './ModifyExamLinks';
import styles from './DashboardPage.module.css';

export default function DashboardPage() {
  return (
    <div className={styles.dashboardPage}>
      <DashboardHeader />

      <div className={styles.actionsGrid}>
        <div className={styles.gridColumn}>
          <CreateExamLinks />
          <ModifyExamLinks />
        </div>
        
      </div>
    </div>
  );
}