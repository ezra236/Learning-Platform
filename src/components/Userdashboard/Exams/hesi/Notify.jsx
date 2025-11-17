import React from "react";
import styles from "./Notify.module.css";

export default function Notify({ onClose, onContinue, onStartFresh }) {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.icon}>📚</div>
          <h3>Continue Your Progress?</h3>
        </div>
        
        <div className={styles.content}>
          <p>We found an unfinished attempt for this exam. You can continue where you left off or start fresh.</p>
          
          <div className={styles.features}>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>⏱️</span>
              <span>Saved time & progress</span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>📝</span>
              <span>Previous answers saved</span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>🔄</span>
              <span>Start from beginning</span>
            </div>
          </div>
        </div>
        
        <div className={styles.actions}>
          <button 
            className={styles.continueBtn} 
            onClick={onContinue}
          >
            🚀 Continue Attempt
          </button>
          <button 
            className={styles.freshBtn} 
            onClick={onStartFresh}
          >
            🔄 Start Fresh
          </button>
        </div>
      </div>
    </div>
  );
}