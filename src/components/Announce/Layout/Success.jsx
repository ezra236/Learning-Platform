import React, { useEffect } from "react";
import styles from "./Toast.module.css";

export default function SuccessToast({ message = "Success", onClose }) {
  useEffect(() => {
    const t = setTimeout(() => onClose && onClose(), 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={styles.toastContainer}>
      <div className={`${styles.toast} ${styles.success}`}>
        <div className={styles.toastContent}>
          <div className={styles.iconWrapper}>
            <div className={styles.icon}>
              ✅
            </div>
            <div className={styles.iconPulse}></div>
          </div>
          <div className={styles.textContent}>
            <strong className={styles.title}>Success! 🎉</strong>
            <div className={styles.message}>{message}</div>
          </div>
          <button 
            className={styles.closeButton} 
            onClick={() => onClose && onClose()}
            aria-label="Close notification"
          >
            <span className={styles.closeIcon}>✕</span>
          </button>
        </div>
        <div className={styles.progressBar}>
          <div className={styles.progressFill}></div>
        </div>
      </div>
    </div>
  );
}