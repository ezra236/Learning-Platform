// components/insights/ErrorState.jsx
"use client";

import React from "react";
import styles from "./ErrorState.module.css";

export default function ErrorState({ message, onRetry }) {
  return (
    <div className={styles.container}>
      <div className={styles.errorContent}>
        <div className={styles.errorIcon}>⚠️</div>
        
        <div className={styles.errorText}>
          <h2 className={styles.errorTitle}>Something went wrong</h2>
          <p className={styles.errorMessage}>{message}</p>
        </div>
        
        <div className={styles.errorActions}>
          <button 
            className={styles.retryButton}
            onClick={onRetry}
          >
            <span className={styles.retryIcon}>🔄</span>
            Try Again
          </button>
          <button 
            className={styles.secondaryButton}
            onClick={() => window.location.reload()}
          >
            <span className={styles.refreshIcon}>↻</span>
            Refresh Page
          </button>
        </div>
        
        <div className={styles.errorTips}>
          <div className={styles.tip}>
            <span className={styles.tipIcon}>🔍</span>
            <span>Check your internet connection</span>
          </div>
          <div className={styles.tip}>
            <span className={styles.tipIcon}>⏱️</span>
            <span>Wait a few minutes and try again</span>
          </div>
          <div className={styles.tip}>
            <span className={styles.tipIcon}>📞</span>
            <span>Contact support if the problem persists</span>
          </div>
        </div>
      </div>
    </div>
  );
}