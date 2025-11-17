// src/components/SignInSuccessModal.jsx
import React from "react";
import classNames from "classnames";
import styles from "./SignInSuccessModal.module.css";

export default function SignInSuccessModal({ visible }) {
  return (
    <div
      className={classNames(styles.container, {
        [styles.visible]: visible,
        [styles.hidden]: !visible,
      })}
      role="status"
      aria-live="polite"
    >
      <div className={styles.card}>
        <div className={styles.icon} aria-hidden>
          ✓
        </div>
        <div className={styles.content}>
          <div className={styles.title}>Signed in</div>
          <div className={styles.subtitle}>Welcome back — redirecting to your dashboard.</div>
        </div>
      </div>
    </div>
  );
}
