import React from 'react';
import styles from './Notify.module.css';

export default function Notify({ onStartFresh, onContinue }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.icon}>📚</div>
        <h3 className={styles.title}>Continue Your Progress?</h3>
        <p className={styles.message}>
          We found an existing attempt. Would you like to continue where you left off or start fresh?
        </p>
        <div className={styles.buttons}>
          <button 
            className={`${styles.button} ${styles.buttonFresh}`}
            onClick={onStartFresh}
          >
            🔄 Start Fresh
          </button>
          <button 
            className={`${styles.button} ${styles.buttonContinue}`}
            onClick={onContinue}
          >
            ➡️ Continue Attempt
          </button>
        </div>
      </div>
    </div>
  );
}