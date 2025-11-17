// frontend/src/components/BottomRightSuccessModal/BottomRightSuccessModal.js
'use client';
import styles from './BottomRightSuccessModal.module.css';

export default function BottomRightSuccessModal({ message = "Success" }) {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.icon}><i className="fas fa-check-circle"></i></div>
        <div className={styles.text}>{message}</div>
      </div>
    </div>
  );
}
