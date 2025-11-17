import React, { useEffect, useRef } from "react";
import styles from "./Modal.module.css";

export default function Modal({ isOpen, onClose, onConfirm, subscription, loading = false }) {
  const overlayRef = useRef(null);
  const contentRef = useRef(null);
  const lastFocusedRef = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
      // simple focus trap: keep focus inside modal when Tab pressed
      if (e.key === "Tab" && contentRef.current) {
        const focusable = contentRef.current.querySelectorAll(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      }
    };

    if (isOpen) {
      // save last focused element to restore later
      lastFocusedRef.current = document.activeElement;
      // lock body scroll
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEscape);
      // focus the modal content (or first focusable)
      setTimeout(() => {
        if (!contentRef.current) return;
        const focusable = contentRef.current.querySelectorAll(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length) {
          focusable[0].focus();
        } else {
          contentRef.current.focus();
        }
      }, 0);
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleEscape);
      // restore focus
      if (lastFocusedRef.current && lastFocusedRef.current.focus) {
        try { lastFocusedRef.current.focus(); } catch (e) {}
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className={styles.modalOverlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={contentRef}
        className={styles.modalContent}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        <div className={styles.modalHeader}>
          <div className={styles.headerIcon} aria-hidden>⚠️</div>
          <h3 id="modal-title" className={styles.modalTitle}>Confirm Deletion</h3>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close modal"
          >
            <span>×</span>
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.warningSection}>
            <div className={styles.warningIcon}>🚨</div>
            <p className={styles.warningText}>
              You are about to delete the subscription for{" "}
              <strong className={styles.highlight}>{subscription?.user?.username}</strong>
            </p>
          </div>

          <div className={styles.subscriptionCard}>
            <div className={styles.cardHeader}>
              <div className={styles.userAvatar}>
                {subscription?.user?.username?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className={styles.userInfo}>
                <div className={styles.userName}>{subscription?.user?.username}</div>
                <div className={styles.userEmail}>{subscription?.user?.email}</div>
              </div>
            </div>

            <div className={styles.cardDetails}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>📋 Plan:</span>
                <span className={styles.detailValue}>{subscription?.plan?.title}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>🎯 Exam Type:</span>
                <span className={styles.detailValue}>{subscription?.plan?.exam_type}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>🔔 Status:</span>
                <span className={subscription?.is_active ? styles.statusActive : styles.statusExpired}>
                  {subscription?.is_active ? "✅ Active" : "❌ Expired"}
                </span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>📅 Finish Date:</span>
                <span className={styles.detailValue}>
                  {subscription ? new Date(subscription.finish_date).toLocaleString() : ""}
                </span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>⏰ Days Remaining:</span>
                <span className={styles.detailValue}>{subscription?.days_remaining ?? "-"}</span>
              </div>
            </div>
          </div>

          <div className={styles.consequences}>
            <div className={styles.consequenceItem}>
              <span className={styles.consequenceIcon}>📧</span>
              <span>User will be notified via email</span>
            </div>
            <div className={styles.consequenceItem}>
              <span className={styles.consequenceIcon}>⚠️</span>
              <span>This action cannot be undone</span>
            </div>
            <div className={styles.consequenceItem}>
              <span className={styles.consequenceIcon}>🔍</span>
              <span>Action will be logged for audit purposes</span>
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button
            className={styles.cancelButton}
            onClick={onClose}
            disabled={loading}
          >
            <span className={styles.buttonIcon}>←</span>
            Cancel
          </button>
          <button
            className={styles.confirmButton}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className={styles.buttonSpinner} aria-hidden></span>
                Deleting...
              </>
            ) : (
              <>
                <span className={styles.buttonIcon}>🗑️</span>
                Delete Subscription
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
