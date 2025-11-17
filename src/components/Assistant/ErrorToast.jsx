// ErrorToast.jsx
import React, { useEffect } from "react";
import styles from "./ErrorToast.module.css";

export default function ErrorToast({ show = false, message = "", onClose = () => {} }) {
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => onClose(), 6000);
    return () => clearTimeout(t);
  }, [show]);

  if (!show) return null;
  
  return (
    <div className={styles.wrapper}>
      <div className={styles.toast}>
        <div className={styles.icon}>
          <i className="fas fa-exclamation"></i>
        </div>
        <div className={styles.content}>
          <div className={styles.title}>Error</div>
          <div className={styles.message}>{message}</div>
        </div>
        <button className={styles.close} onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
        <div className={styles.progress}></div>
      </div>
    </div>
  );
}