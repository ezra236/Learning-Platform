// components/Success.jsx
import React, { useEffect } from "react";
import styles from "./Success.module.css";

export default function Success({ message, onClose, timeout = 3500 }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => {
      onClose?.();
    }, timeout);
    return () => clearTimeout(t);
  }, [message]);

  if (!message) return null;
  return (
    <div className={styles.toast}>
      <div className={styles.inner}>
        <span className={styles.icon}>✅</span>
        {message}
        <button className={styles.closeButton} onClick={onClose}>
          ✕
        </button>
      </div>
    </div>
  );
}