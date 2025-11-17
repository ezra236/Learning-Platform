// SuccessToast.jsx
import React, { useEffect } from "react";
import styles from "./SuccessToast.module.css";

export default function SuccessToast({ show = false, message = "", onClose = () => {} }) {
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => onClose(), 5000);
    return () => clearTimeout(t);
  }, [show]);

  if (!show) return null;
  
  return (
    <div className={styles.wrapper}>
      <div className={styles.toast}>
        <div className={styles.toastMain}>
          <div className={styles.icon}>
            <i className="fas fa-check"></i>
          </div>
          <div className={styles.content}>
            <div className={styles.title}>Success</div>
            <div className={styles.message}>{message}</div>
          </div>
        </div>
        <button className={styles.close} onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
        <div className={styles.progressBar}>
          <div className={styles.progress}></div>
        </div>
      </div>
    </div>
  );
}