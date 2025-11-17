'use client';
import styles from './BottomRightErrorModal.module.css';

export default function BottomRightErrorModal({ message = "Error" }) {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.icon}><i className="fas fa-exclamation-circle"></i></div>
        <div className={styles.text}>{message}</div>
      </div>
    </div>
  );
}
