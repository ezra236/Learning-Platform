import React, { useState } from "react";
import styles from "./Report.module.css";

export default function Report({ onSubmit }) {
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (description.trim()) {
      onSubmit(description);
      setDescription("");
      setIsOpen(false);
    }
  };

  return (
    <>
      <button 
        className={styles.reportBtn}
        onClick={() => setIsOpen(true)}
      >
        🚨 Report Issue
      </button>

      {isOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.header}>
              <h3>🚨 Report an Issue</h3>
              <button 
                className={styles.closeBtn}
                onClick={() => setIsOpen(false)}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Describe the issue:</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please describe the problem you encountered..."
                  rows="4"
                  required
                />
              </div>
              
              <div className={styles.actions}>
                <button 
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className={styles.submitBtn}
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}