// ActionToast.jsx
import React from 'react';
import styles from './ActionToast.module.css';
import cx from 'classnames';

const ActionToast = ({ show = false, type = 'success', message = '' }) => {
  if (!show) return null;

  return (
    <div className={styles.wrapper} aria-live="polite" aria-atomic="true">
      <div className={cx(styles.toast, type === 'success' ? styles.success : styles.error)}>
        <div className={styles.icon}>
          {type === 'success' ? (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
        <div className={styles.message}>{message}</div>
      </div>
    </div>
  );
};

export default ActionToast;
