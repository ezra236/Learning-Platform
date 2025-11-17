'use client';
import { useEffect } from 'react';
import styles from './toast.module.css';

/**
 * Toast component
 * Props:
 * - visible: boolean
 * - type: 'success' | 'error' | 'info'
 * - message: string
 * - duration: number (ms)
 * - onClose: function
 */
export default function Toast({ visible = false, type = 'info', message = '', duration = 5000, onClose }) {
  useEffect(() => {
    if (!visible) return;
    if (duration <= 0) return;
    const t = setTimeout(() => {
      onClose && onClose();
    }, duration);
    return () => clearTimeout(t);
  }, [visible, duration, onClose]);

  if (!visible) return null;

  const typeClass = type === 'success' ? styles.success : type === 'error' ? styles.error : styles.info;

  return (
    <div className={`${styles.toast} ${typeClass}`} role="status" aria-live="polite">
      <div className={styles.content}>
        <div className={styles.icon} aria-hidden>
          {type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}
        </div>
        <div className={styles.message}>{message}</div>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">×</button>
      </div>
    </div>
  );
}
