// components/Password.jsx
import React, { useState } from "react";
import { ensureCsrf, getCookie } from "@/lib/password";
import styles from "./Password.module.css";

export default function Password({ onSuccess, onError }) {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const [stage, setStage] = useState("idle"); // idle, sent, verified
  const [code, setCode] = useState("");
  const [resetToken, setResetToken] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const steps = [
    { id: 'idle', label: 'Request', icon: '📧' },
    { id: 'sent', label: 'Verify', icon: '🔐' },
    { id: 'verified', label: 'Reset', icon: '🔄' }
  ];

  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.id === stage);
  };

  async function sendCode() {
    setLoading(true);
    try {
      await ensureCsrf();
      const resp = await fetch(`${base}/api/auth/password/send-code/`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "X-CSRFToken": getCookie("csrftoken") },
        body: JSON.stringify({}),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.detail || "Failed to send code");
      setStage("sent");
      onSuccess?.(data.detail || "📧 Verification code sent to your email!");
    } catch (err) {
      onError?.(err.message || "Failed to send verification code");
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode() {
    if (code.length < 6) {
      return onError?.("Please enter the 6-digit code");
    }
    
    setLoading(true);
    try {
      await ensureCsrf();
      const resp = await fetch(`${base}/api/auth/password/verify-code/`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "X-CSRFToken": getCookie("csrftoken") },
        body: JSON.stringify({ code }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.detail || "Invalid code");
      setResetToken(data.reset_token);
      setStage("verified");
      onSuccess?.("✅ Code verified! Now set your new password");
    } catch (err) {
      onError?.(err.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword() {
    if (!resetToken) return onError?.("No reset token");
    if (newPassword.length < 8) return onError?.("Password must be at least 8 characters");
    
    setLoading(true);
    try {
      await ensureCsrf();
      const resp = await fetch(`${base}/api/auth/password/reset/`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "X-CSRFToken": getCookie("csrftoken") },
        body: JSON.stringify({ reset_token: resetToken, new_password: newPassword }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.detail || "Failed to reset password");
      onSuccess?.(data.detail || "🎉 Password updated successfully!");
      setStage("idle");
      setCode("");
      setNewPassword("");
      setResetToken(null);
    } catch (err) {
      onError?.(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.icon}>🔒</div>
        <div>
          <h2 className={styles.title}>Password Security</h2>
          <p className={styles.subtitle}>Secure your account with a new password</p>
        </div>
      </div>

      <div className={styles.progress}>
        {steps.map((step, index) => {
          const isActive = step.id === stage;
          const isCompleted = index < getCurrentStepIndex();
          const stepClass = `
            ${styles.step} 
            ${isActive ? styles.active : ''} 
            ${isCompleted ? styles.completed : ''}
          `;
          
          return (
            <div key={step.id} className={stepClass}>
              <div className={styles.stepIndicator}>
                {isCompleted ? '✓' : step.icon}
              </div>
              <div className={styles.stepLabel}>{step.label}</div>
            </div>
          );
        })}
      </div>

      <div className={styles.stageContent}>
        {stage === "idle" && (
          <>
            <div className={styles.stageTitle}>🛡️ Secure Password Reset</div>
            <p className={styles.description}>
              Protect your account by regularly updating your password. We'll send a verification code to your registered email to ensure it's really you making this change.
            </p>
            <button 
              className={`${styles.button} ${styles.primary}`} 
              onClick={sendCode} 
              disabled={loading}
            >
              {loading ? (
                <>⏳ Sending Code...</>
              ) : (
                <>📧 Send Verification Code</>
              )}
            </button>
            
            <div className={styles.featureList}>
              <div className={styles.featureItem}>
                <span className={styles.featureIcon}>✓</span>
                Secure verification process
              </div>
              <div className={styles.featureItem}>
                <span className={styles.featureIcon}>✓</span>
                Instant email delivery
              </div>
              <div className={styles.featureItem}>
                <span className={styles.featureIcon}>✓</span>
                6-digit code for security
              </div>
            </div>
          </>
        )}

        {stage === "sent" && (
          <>
            <div className={styles.stageTitle}>📨 Enter Verification Code</div>
            <p className={styles.description}>
              We've sent a 6-digit verification code to your email address. Please check your inbox and enter the code below to continue.
            </p>
            <input 
              className={styles.input}
              value={code} 
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} 
              placeholder="Enter 6-digit code" 
              maxLength="6"
              type="text"
              pattern="\d{6}"
            />
            <div className={styles.buttonGroup}>
              <button 
                className={`${styles.button} ${styles.primary}`} 
                onClick={verifyCode} 
                disabled={loading || code.length !== 6}
              >
                {loading ? "Verifying..." : "✅ Verify Code"}
              </button>
              <button 
                className={`${styles.button} ${styles.secondary}`} 
                onClick={() => setStage("idle")}
              >
                ↩️ Back
              </button>
            </div>
          </>
        )}

        {stage === "verified" && (
          <>
            <div className={styles.stageTitle}>🔑 Create New Password</div>
            <p className={styles.description}>
              Create a strong, unique password for your account. Make sure it's at least 8 characters long and includes a mix of letters, numbers, and symbols for maximum security.
            </p>
            <input 
              className={styles.input}
              type="password" 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
              placeholder="Enter new password (min 8 characters)" 
            />
            <div className={styles.buttonGroup}>
              <button 
                className={`${styles.button} ${styles.primary}`} 
                onClick={resetPassword} 
                disabled={loading || newPassword.length < 8}
              >
                {loading ? "Saving..." : "💾 Save New Password"}
              </button>
              <button 
                className={`${styles.button} ${styles.secondary}`} 
                onClick={() => setStage("sent")}
              >
                ↩️ Back
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}