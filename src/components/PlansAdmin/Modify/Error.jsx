"use client";

import React from "react";
import styles from "./Toasts.module.css";
import { FaExclamationTriangle, FaCheckCircle, FaTimes } from "react-icons/fa";

export default function ErrorToast({ message = "An error occurred", onClose }) {
  return (
    <div className={styles.error} role="alert" aria-live="assertive">
      <div className={styles.toastContent}>
        <FaExclamationTriangle className={styles.toastIcon} />
        <div className={styles.toastMessage}>{message}</div>
        <button onClick={onClose} className={styles.toastClose}>
          <FaTimes />
        </button>
      </div>
      <div className={styles.progressBar}></div>
    </div>
  );
}