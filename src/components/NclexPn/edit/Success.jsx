import React, { useEffect, useState } from 'react';
import styles from './Success.module.css';

export default function Success({ message }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (!message) return null;

  return (
    <div className={`${styles.successToast} ${isVisible ? styles.show : styles.hide}`}>
      <div className={styles.toastContent}>
        <span className={styles.toastIcon}>✅</span>
        <span className={styles.toastMessage}>{message}</span>
      </div>
    </div>
  );
}