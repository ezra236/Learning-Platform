"use client";

import React from "react";
import styles from "./Toasts.module.css";
import { FaCheckCircle, FaTimes } from "react-icons/fa";

export default function Done({ message = "Done", onClose }) {
  return (
    <div className={styles.done} role="status" aria-live="polite">
      <div className={styles.toastContent}>
        <FaCheckCircle className={styles.toastIcon} />
        <div className={styles.toastMessage}>{message}</div>
        <button onClick={onClose} className={styles.toastClose}>
          <FaTimes />
        </button>
      </div>
      <div className={styles.progressBar}></div>
    </div>
  );
}