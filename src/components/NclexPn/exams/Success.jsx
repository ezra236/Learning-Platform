import React, { useState, useEffect } from 'react';
import styles from './Success.module.css';

export default function Success({ message }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 4800); // Hide before message clears for smooth transition
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (!message) return null;

  return (
    <div className={`${styles.successBox} ${isVisible ? styles.show : styles.hide}`}>
      <span className={styles.successIcon}>✅</span>
      <span className={styles.successText}>{message}</span>
    </div>
  );
}