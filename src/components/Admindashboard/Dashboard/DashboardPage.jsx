import React from 'react';
import DashboardHeader from './DashboardHeader';
import TopRightStats from './TopRightStats';
import CreateExamLinks from './CreateExamLinks';
import ModifyExamLinks from './ModifyExamLinks';
import GrowthBarChart from './GrowthBarChart';
import GrowthPieChart from './GrowthPieChart';
import UserActionsLinks from './UserActionsLinks';
import SubscriptionsStat from './SubscriptionsStat';
import VerifiedUsersStat from './VerifiedUsersStat';
import CreateCampaignLink from './CreateCampaignLink';
import CreateAnnouncementLink from './CreateAnnouncementLink';
import AdInsights from './AdInsights';
import styles from './DashboardPage.module.css';

export default function DashboardPage() {
  return (
    <div className={styles.dashboardPage}>
      <DashboardHeader />
      
      <div className={styles.statsRow}>
        <TopRightStats />
        <SubscriptionsStat />
        <VerifiedUsersStat />
      </div>

      <div className={styles.chartsRow}>
        <GrowthBarChart />
        <GrowthPieChart />
      </div>

      <div className={styles.actionsGrid}>
        <div className={styles.gridColumn}>
          <CreateExamLinks />
          <ModifyExamLinks />
        </div>
        
        <div className={styles.gridColumn}>
          <UserActionsLinks />
          <CreateCampaignLink />
          <CreateAnnouncementLink />
          <AdInsights />
        </div>
      </div>
    </div>
  );
}