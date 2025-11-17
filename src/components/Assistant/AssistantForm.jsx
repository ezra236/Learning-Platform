// AssistantForm.jsx
import React, { useState } from "react";
import styles from "./AssistantForm.module.css";

export default function AssistantForm({ onCreate }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e?.preventDefault();
    setSubmitting(true);
    try {
      await onCreate({ email, password });
      setEmail("");
      setPassword("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.iconWrapper}>
          <i className="fas fa-user-plus"></i>
        </div>
        <div>
          <h3 className={styles.title}>Add New Assistant</h3>
          <p className={styles.subtitle}>Create a new administrative account</p>
        </div>
      </div>
      
      <form onSubmit={submit} className={styles.form}>
        <div className={styles.inputGroup}>
          <label className={styles.label}>
            <span className={styles.labelText}>Email Address</span>
            <div className={styles.inputContainer}>
              <i className="fas fa-envelope"></i>
              <input 
                className={styles.input} 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                type="email" 
                placeholder="assistant@company.com"
              />
            </div>
          </label>
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>
            <span className={styles.labelText}>Password</span>
            <div className={styles.inputContainer}>
              <i className="fas fa-lock"></i>
              <input 
                className={styles.input} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                type="password" 
                placeholder="Enter secure password"
                minLength={8}
              />
            </div>
          </label>
          <div className={styles.passwordHint}>
            <i className="fas fa-info-circle"></i>
            Minimum 8 characters required
          </div>
        </div>

        <button 
          className={`${styles.submitBtn} ${submitting ? styles.loading : ''}`} 
          type="submit" 
          disabled={submitting}
        >
          {submitting ? (
            <>
              <i className="fas fa-spinner fa-spin"></i>
              Creating Account...
            </>
          ) : (
            <>
              <i className="fas fa-plus"></i>
              Create Assistant Account
            </>
          )}
        </button>
        
        <div className={styles.features}>
          <h4 className={styles.featuresTitle}>Account Features</h4>
          <ul className={styles.featuresList}>
            <li>
              <i className="fas fa-shield-check"></i>
              <span>Secure administrative access</span>
            </li>
            <li>
              <i className="fas fa-user-tie"></i>
              <span>Role-based permissions</span>
            </li>
            <li>
              <i className="fas fa-clock-rotate-left"></i>
              <span>Activity monitoring</span>
            </li>
            <li>
              <i className="fas fa-sliders"></i>
              <span>Flexible access controls</span>
            </li>
          </ul>
        </div>
      </form>
    </div>
  );
}