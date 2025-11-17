import React from "react";
import styles from "./Success.module.css";

export default function Success({ message }) {
  return (
    <div className={styles.toast}>
      <div className={styles.toastContent}>
        <div className={styles.icon}>✅</div>
        <div className={styles.message}>{message}</div>
      </div>
      <div className={styles.progressBar}></div>
    </div>
  );
}