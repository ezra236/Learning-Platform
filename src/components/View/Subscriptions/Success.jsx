// components/subscriptions/Success.jsx
import React, { useEffect, useState } from "react";
import styles from "./Success.module.css";

export default function Success({ message = "Success", onClose }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 4500);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`${styles.toast} ${isVisible ? styles.visible : ''}`}>
      <div className={styles.toastContent}>
        <div className={styles.iconContainer}>
          <div className={styles.icon}>✓</div>
          <div className={styles.progressBar}>
            <div className={styles.progressFill}></div>
          </div>
        </div>
        <div className={styles.textContent}>
          <div className={styles.title}>Success!</div>
          <div className={styles.message}>{message}</div>
        </div>
        <button className={styles.closeBtn} onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}>
          ×
        </button>
      </div>
    </div>
  );
}