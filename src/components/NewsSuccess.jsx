// components/NewsSuccess.jsx
import React, { useEffect } from "react";
import styles from "./newssuccess.module.css";

const NewsSuccess = ({ message = "Subscribed!", duration = 5000, onClose }) => {
  useEffect(() => {
    const t = setTimeout(() => {
      onClose && onClose();
    }, duration);

    return () => clearTimeout(t);
  }, [duration, onClose]);

  return (
    <div className={styles.container} role="status" aria-live="polite">
      <div className={styles.content}>
        <div className={styles.left}>
          <span className={styles.icon} aria-hidden>
            ✅
          </span>
        </div>
        <div className={styles.middle}>
          <div className={styles.title}>Subscribed</div>
          <div className={styles.message}>{message}</div>
        </div>
        <button className={styles.closeBtn} onClick={() => onClose && onClose()} aria-label="Close">
          ✕
        </button>
      </div>
    </div>
  );
};

export default NewsSuccess;
