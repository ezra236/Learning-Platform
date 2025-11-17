// DashboardHeader.jsx
import React from "react";
import styles from "./DashboardHeader.module.css";

export default function DashboardHeader() {
  return (
    <div className={styles.dashboardHeader}>
      <div className={styles.headerBackground}></div>

      <div className={styles.headerContent}>
        <div className={styles.textContent}>
          <h1 className={styles.title}>
            <span className={styles.titleIcon}>🎯</span>
            Assistant Dashboard
          </h1>

          <p className={styles.description}>
            Welcome to your command center! Manage exams with ease.
            Everything you need to oversee the platform is right here.
          </p>

        </div>

        <div className={styles.visualContent}>
          <div className={styles.floatingIcons}>
            <span className={styles.icon}>📊</span>
            <span className={styles.icon}>👥</span>
            <span className={styles.icon}>🎓</span>
            <span className={styles.icon}>⚡</span>
          </div>
        </div>
      </div>
    </div>
  );
}
