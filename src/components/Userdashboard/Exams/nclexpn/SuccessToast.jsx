import React, { useEffect } from 'react';
import styles from './SuccessToast.module.css';

export default function SuccessToast({ type = 'success', text, onClose }) {
  useEffect(() => {
    const t = setTimeout(() => onClose && onClose(), 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  const icon = type === 'success' ? '✅' : '❌';
  const toastClass = type === 'success' ? styles.toastSuccess : styles.toastError;

  return (
    <div className={`${styles.toast} ${toastClass}`}>
      <span className={styles.toastIcon}>{icon}</span>
      <div className={styles.toastContent}>{text}</div>
    </div>
  );
}