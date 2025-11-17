import { useState, useRef, useEffect } from 'react';
import styles from './ReviewBlock.module.css';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';

function getCookie(name) {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

const ReviewBlock = ({ onClose = () => {} }) => {
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!review.trim()) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await fetch(`${BASE}/api/csrf/`, {
        method: 'GET',
        credentials: 'include',
      });

      const csrfToken = getCookie('csrftoken');

      const resp = await fetch(`${BASE}/api/reviews/submit/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
        },
        body: JSON.stringify({ text: review }),
      });

      const data = await resp.json().catch(() => ({}));

      if (resp.ok && data.success) {
        setShowSuccess(true);
        setReview('');
        timeoutRef.current = setTimeout(() => {
          setShowSuccess(false);
          timeoutRef.current = null;
        }, 3000);
      } else {
        const msg = data.error || data.message || 'Failed to submit review';
        setErrorMsg(msg);
        console.error('Review error response:', data);
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      setErrorMsg('Network or server error. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className={styles.overlay}>
        <div className={styles.reviewBlock}>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close review form"
          >
            <i className="fas fa-times"></i>
          </button>

          <div className={styles.header}>
            <div className={styles.headerIcon}>
              <i className="fas fa-star"></i>
            </div>
            <h3>Share Your Thoughts! 💫</h3>
            <p>We'd love to hear about your experience</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.textareaContainer}>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="What did you think of our service?"
                className={styles.textarea}
                rows="3"
                maxLength="500"
                aria-label="Write your review"
              />
              <div className={styles.charCount}>
                <i className="fas fa-edit"></i>
                {review.length}/500
              </div>
            </div>

            {errorMsg && (
              <div className={styles.errorMsg} role="alert">
                <i className="fas fa-exclamation-circle"></i>
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={!review.trim() || isSubmitting}
              className={styles.submitButton}
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Submitting...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane"></i>
                  Submit Review
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {showSuccess && (
        <div className={styles.successToast} role="status" aria-live="polite">
          <i className="fas fa-check-circle"></i>
          Review submitted successfully!
        </div>
      )}
    </>
  );
};

export default ReviewBlock;