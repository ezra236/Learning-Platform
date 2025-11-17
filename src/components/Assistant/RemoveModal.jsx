// RemoveModal.jsx
import React, { useEffect } from "react";
import styles from "./RemoveModal.module.css";

export default function RemoveModal({ show = false, email = "", onCancel = () => {}, onConfirm = () => {} }) {
  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [show]);

  if (!show) return null;

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.icon}>
          <i className="fas fa-exclamation-triangle"></i>
        </div>
        <div className={styles.content}>
          <h3 className={styles.title}>Confirm Deletion</h3>
          <p className={styles.message}>
            Are you sure you want to delete the assistant account for 
            <strong> {email}</strong>? This action cannot be undone.
          </p>
        </div>
        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onCancel}>
            <i className="fas fa-times"></i>
            Cancel
          </button>
          <button className={styles.confirmBtn} onClick={onConfirm}>
            <i className="fas fa-trash"></i>
            Delete Assistant
          </button>
        </div>
      </div>
    </div>
  );
}