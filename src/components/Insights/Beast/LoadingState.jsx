// components/insights/LoadingState.jsx
"use client";

import React from "react";
import styles from "./LoadingState.module.css";

export default function LoadingState({ type = "insights" }) {
  return (
    <div className={styles.container}>
      <div className={styles.loadingContent}>
        <div className={styles.loadingAnimation}>
          <div className={styles.spinner}>
            <div className={styles.spinnerInner}>
              {[...Array(12)].map((_, i) => (
                <div 
                  key={i}
                  className={styles.spinnerBar}
                  style={{ transform: `rotate(${i * 30}deg)` }}
                />
              ))}
            </div>
          </div>
          <div className={styles.loadingIcon}>📊</div>
        </div>
        
        <div className={styles.loadingText}>
          <h2 className={styles.loadingTitle}>
            {type === "insights" ? "Loading Insights" : "Loading Content"}
          </h2>
          <p className={styles.loadingSubtitle}>
            Preparing your analytics dashboard...
          </p>
        </div>
        
        <div className={styles.progressContainer}>
          <div className={styles.progressBar}>
            <div className={styles.progressFill}></div>
          </div>
          <div className={styles.progressText}>Loading data...</div>
        </div>
        
        <div className={styles.loadingTips}>
          <div className={styles.tipCard}>
            <span className={styles.tipIcon}>💡</span>
            <div className={styles.tipContent}>
              <strong>Pro Tip</strong>
              <div>Use filters to focus on specific campaign performance</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}