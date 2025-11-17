// AddModal.jsx
import React, { useEffect } from "react";
import styles from "./AddModal.module.css";

export default function AddModal({ show = false, onClose = () => {} }) {
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
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.successAnimation}>
          <div className={styles.checkmark}>
            <i className="fas fa-check"></i>
          </div>
        </div>
        
        <div className={styles.content}>
          <h2 className={styles.title}>Assistant Added!</h2>
          <p className={styles.message}>
            The new admin assistant has been successfully added to your team. 
            They will receive an email notification with access instructions.
          </p>
        </div>
        
        <div className={styles.actions}>
          <button className={styles.continueBtn} onClick={onClose}>
            <i className="fas fa-check"></i>
            Continue Managing
          </button>
        </div>
        
        <div className={styles.footer}>
          <div className={styles.tip}>
            <i className="fas fa-lightbulb"></i>
            <span>Tip: New assistants should verify their email to activate full access</span>
          </div>
        </div>
      </div>
    </div>
  );
}