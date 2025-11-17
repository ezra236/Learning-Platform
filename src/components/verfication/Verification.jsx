'use client';
import { useState, useRef, useEffect } from 'react';
import styles from './verification.module.css';
import Toast from './Toast'; // Toast.jsx is in the same folder (verfication)

function getCookie(name) {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  if (match) return decodeURIComponent(match[2]);
  return null;
}

export default function Verification({ email, onBack }) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);

  // toast: { visible, type, message, duration }
  const [toast, setToast] = useState({ visible: false, type: 'info', message: '', duration: 5000 });
  const inputsRef = useRef([]);
  const redirectTimerRef = useRef(null);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  useEffect(() => {
    return () => {
      // cleanup any redirect timers on unmount
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, []);

  const showToast = ({ type = 'info', message = '', duration = 5000 }) => {
    setToast({ visible: true, type, message, duration });
  };

  const hideToast = () => setToast(prev => ({ ...prev, visible: false }));

  const focusInput = (index) => {
    if (inputsRef.current[index]) {
      inputsRef.current[index].focus();
    }
  };

  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      focusInput(index + 1);
    }

    // Auto-submit when all digits are filled (when last char entered)
    if (newCode.every(digit => digit !== '') && index === 5) {
      handleSubmit(newCode.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      focusInput(index - 1);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').slice(0, 6);
    if (/^\d+$/.test(pasteData)) {
      const pasteArray = pasteData.split('');
      const newCode = [...code];
      pasteArray.forEach((digit, idx) => {
        if (idx < 6) newCode[idx] = digit;
      });
      setCode(newCode);
      focusInput(Math.min(pasteData.length, 5));
    }
  };

  const handleSubmit = async (verificationCode = code.join('')) => {
    if (verificationCode.length !== 6) return;

    setIsLoading(true);
    hideToast();
    try {
      // ensure csrf cookie is set (backend will set cookie on GET)
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}/api/auth/csrf/`, {
        method: 'GET',
        credentials: 'include'
      });
      const csrftoken = getCookie('csrftoken');

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}/api/auth/verify/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(csrftoken ? { 'X-CSRFToken': csrftoken } : {})
        },
        body: JSON.stringify({
          email,
          code: verificationCode
        })
      });

      const data = await res.json();

      if (!res.ok) {
        showToast({ type: 'error', message: data.detail || 'Verification failed.', duration: 5000 });
      } else {
        // Show success toast for 3 seconds then redirect
        const redirectUrl = data.redirect || '/user/dashboard/';
        showToast({ type: 'success', message: 'Account successfully created. Redirecting...', duration: 3000 });

        // clear any previous timers
        if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
        redirectTimerRef.current = setTimeout(() => {
          window.location.href = redirectUrl;
        }, 3000);
      }
    } catch (err) {
      showToast({ type: 'error', message: 'Network error. Try again.', duration: 5000 });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    hideToast();
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}/api/auth/csrf/`, {
        method: 'GET',
        credentials: 'include'
      });
      const csrftoken = getCookie('csrftoken');

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}/api/auth/resend/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(csrftoken ? { 'X-CSRFToken': csrftoken } : {})
        },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (!res.ok) {
        showToast({ type: 'error', message: data.detail || 'Failed to resend code.', duration: 5000 });
      } else {
        showToast({ type: 'info', message: 'Verification code resent. Check your inbox (or spam).', duration: 5000 });
        setCountdown(30);
      }
    } catch (err) {
      showToast({ type: 'error', message: 'Network error. Try again.', duration: 5000 });
    }
  };

  const clearCode = () => {
    setCode(['', '', '', '', '', '']);
    focusInput(0);
  };

  return (
    <div className={styles.verificationContainer}>
      <button 
        onClick={onBack}
        className={styles.backButton}
        type="button"
      >
        <i className="fas fa-arrow-left"></i>
        Back to Sign Up
      </button>

      <div className={styles.header}>
        <div className={styles.iconContainer}>
          <i className="fas fa-envelope-open-text"></i>
        </div>
        <h2 className={styles.title}>Verify Your Email</h2>
        <p className={styles.description}>
          We've sent a 6-digit verification code to<br />
          <strong>{email}</strong>
        </p>
      </div>
      
      <div className={styles.codeInputContainer}>
        <div className={styles.codeInputs}>
          {code.map((digit, index) => (
            <input
              key={index}
              ref={el => inputsRef.current[index] = el}
              type="text"
              inputMode="numeric"
              maxLength="1"
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              className={`${styles.codeInput} ${digit ? styles.filled : ''}`}
              autoFocus={index === 0}
            />
          ))}
        </div>
        <div className={styles.codeDigits}>
          {[1, 2, 3, 4, 5, 6].map((num) => (
            <span key={num} className={styles.digitLabel}>{num}</span>
          ))}
        </div>
      </div>

      <button 
        onClick={() => handleSubmit()}
        className={`${styles.verifyButton} ${isLoading ? styles.loading : ''}`}
        disabled={isLoading || code.some(digit => !digit)}
        type="button"
      >
        {isLoading ? (
          <>
            <div className={styles.spinner}></div>
            Verifying...
          </>
        ) : (
          <>
            <i className="fas fa-shield-check"></i>
            Verify & Create Account
          </>
        )}
      </button>

      <div className={styles.actions}>
        <button 
          type="button"
          className={styles.clearButton}
          onClick={clearCode}
        >
          <i className="fas fa-eraser"></i>
          Clear Code
        </button>
        
        <div className={styles.resendContainer}>
          <p className={styles.resendText}>
            Didn't receive the code?{' '}
            {countdown > 0 ? (
              <span className={styles.countdown}>
                <i className="fas fa-clock"></i>
                Resend in {countdown}s
              </span>
            ) : (
              <button 
                type="button"
                className={styles.resendButton}
                onClick={handleResendCode}
              >
                <i className="fas fa-redo"></i>
                Resend Code
              </button>
            )}
          </p>
        </div>
      </div>

      <div className={styles.tips}>
        <h4 className={styles.tipsTitle}>
          <i className="fas fa-lightbulb"></i>
          Tips:
        </h4>
        <ul className={styles.tipsList}>
          <li>
            <i className="fas fa-search"></i>
            Check your spam folder if you don't see the email
          </li>
          <li>
            <i className="fas fa-clock"></i>
            Enter the code quickly as it expires in 10 minutes
          </li>
          <li>
            <i className="fas fa-paste"></i>
            You can paste the code using Ctrl+V (Cmd+V on Mac)
          </li>
        </ul>
      </div>

      {/* Toast component (bottom-right). Show toast for info/error/success */}
      <Toast
        visible={toast.visible}
        type={toast.type}
        message={toast.message}
        duration={toast.duration}
        onClose={hideToast}
      />
    </div>
  );
}
