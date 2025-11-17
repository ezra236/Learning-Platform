// components/Error.jsx
import React, { useEffect } from "react";
import styles from "./Error.module.css";

export default function Error({ message = "An error occurred", onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={styles.notification}>
      <div className={styles.notificationContent}>
        <div className={styles.icon}>❌</div>
        <div className={styles.text}>
          <div className={styles.title}>Error</div>
          <div className={styles.message}>{message}</div>
        </div>
        <button className={styles.close} onClick={onClose}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path 
              d="M13 1L1 13M1 1L13 13" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
      <div className={styles.progressBar} />
    </div>
  );
}