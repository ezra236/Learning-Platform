import React from 'react';
import styles from './UserActionsLinks.module.css';

export default function UserActionsLinks() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          <span className={styles.titleIcon}>👤</span>
          User Actions
        </h3>
        <p className={styles.subtitle}>Quick user management actions</p>
      </div>
      
      <div className={styles.grid}>
        {/* Inactivate User Card */}
        <a href="#" className={`${styles.actionCard} ${styles.inactivateUser}`}>
          <div className={styles.cardContent}>
            <span className={styles.actionIcon}>🚫</span>
            <div className={styles.actionContent}>
              <span className={styles.actionTitle}>Inactivate User</span>
              <span className={styles.actionDesc}>Temporarily disable account access</span>
            </div>
            <div className={styles.actionMeta}>
              <span className={styles.arrow}>→</span>
            </div>
          </div>
          <div className={styles.hoverEffect}></div>
        </a>

        {/* Block User Card */}
        <a href="#" className={`${styles.actionCard} ${styles.blockUser}`}>
          <div className={styles.cardContent}>
            <span className={styles.actionIcon}>🔒</span>
            <div className={styles.actionContent}>
              <span className={styles.actionTitle}>Block User</span>
              <span className={styles.actionDesc}>Permanent account suspension</span>
            </div>
            <div className={styles.actionMeta}>
              <span className={styles.arrow}>→</span>
            </div>
          </div>
          <div className={styles.hoverEffect}></div>
        </a>

        {/* Issue Warning Card */}
        <a href="/admin/management" className={`${styles.actionCard} ${styles.issueWarning}`}>
          <div className={styles.cardContent}>
            <span className={styles.actionIcon}>⚠️</span>
            <div className={styles.actionContent}>
              <span className={styles.actionTitle}>Manage Exams</span>
              <span className={styles.actionDesc}>Delete, Free Trial Operations</span>
            </div>
            <div className={styles.actionMeta}>
              <span className={styles.arrow}>→</span>
            </div>
          </div>
          <div className={styles.hoverEffect}></div>
        </a>

        {/* Send Notice Card */}
        <a href="/admin/pdf" className={`${styles.actionCard} ${styles.sendNotice}`}>
          <div className={styles.cardContent}>
            <span className={styles.actionIcon}>📧</span>
            <div className={styles.actionContent}>
              <span className={styles.actionTitle}>Sell Pdfs</span>
              <span className={styles.actionDesc}>Let user be able to purchase pdfs</span>
            </div>
            <div className={styles.actionMeta}>
              <span className={styles.arrow}>→</span>
            </div>
          </div>
          <div className={styles.hoverEffect}></div>
        </a>

        {/* Newsletters Card */}
        <a href="/admin/newsletter" className={`${styles.actionCard} ${styles.newsletters}`}>
          <div className={styles.cardContent}>
            <span className={styles.actionIcon}>📰</span>
            <div className={styles.actionContent}>
              <span className={styles.actionTitle}>Emails</span>
              <span className={styles.actionDesc}>Manage or send emails</span>
            </div>
            <div className={styles.actionMeta}>
              <span className={styles.arrow}>→</span>
            </div>
          </div>
          <div className={styles.hoverEffect}></div>
        </a>
      </div>
    </div>
  );
}
