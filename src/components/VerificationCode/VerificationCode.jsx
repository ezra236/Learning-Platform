// frontend/src/components/VerificationCode/VerificationCode.js
'use client';
import { useState, useRef, useEffect } from 'react';
import styles from './VerificationCode.module.css';
import { getCookie } from '@/lib/cookies';
import BottomRightErrorModal from '@/components/BottomRightErrorModal/BottomRightErrorModal';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export default function VerificationCode({ email, onBack }) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const inputsRef = useRef([]);
  const [errorModal, setErrorModal] = useState(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const focusInput = (index) => { if (inputsRef.current[index]) inputsRef.current[index].focus(); };

  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const newCode = [...code]; newCode[index] = value; setCode(newCode);
    if (value && index < 5) focusInput(index + 1);
    if (newCode.every(d => d !== '') && index === 5) handleSubmit(newCode.join(''));
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) focusInput(index - 1);
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').slice(0, 6);
    if (/^\d+$/.test(pasteData)) {
      const pasteArray = pasteData.split('');
      const newCode = [...code];
      pasteArray.forEach((digit, i) => { if (i < 6) newCode[i] = digit; });
      setCode(newCode);
      focusInput(Math.min(pasteData.length, 5));
    }
  };

  const handleSubmit = async (verificationCode = code.join('')) => {
    if (verificationCode.length !== 6) return;
    setIsLoading(true);
    try {
      // ensure CSRF cookie set
      await fetch(`${API_BASE}/api/csrf/`, { credentials: "include" });
      const csrftoken = getCookie("csrftoken");
      const resp = await fetch(`${API_BASE}/api/superadmin/verify/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrftoken || ""
        },
        body: JSON.stringify({ email, code: verificationCode })
      });
      const data = await resp.json();
      setIsLoading(false);
      if (!resp.ok) {
        setErrorModal(data.error || "Verification failed");
        setTimeout(() => setErrorModal(null), 4000);
        return;
      }

      // success - show fullpage white overlay + centered spinner for 3 seconds then redirect
      setShowOverlay(true);
      setTimeout(() => {
        router.push("/admin/dashboard");
      }, 3000);

    } catch (err) {
      setIsLoading(false);
      setErrorModal(err.message || "Network error");
      setTimeout(() => setErrorModal(null), 4000);
    }
  };

  const handleResendCode = async () => {
    setCountdown(30);
    // optionally call an endpoint to resend; for now call signup endpoint again to re-send
    try {
      await fetch(`${API_BASE}/api/csrf/`, { credentials: "include" });
      const csrftoken = getCookie("csrftoken");
      const resp = await fetch(`${API_BASE}/api/superadmin/signup/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrftoken || ""
        },
        body: JSON.stringify({ email, password: "" }), // password not needed if stored in session; however backend stores pending password on original signup
      });
      // ignore success/failure UI here
      setErrorModal("If a pending signup exists, a new code was sent (check email).");
      setTimeout(() => setErrorModal(null), 3000);
    } catch (err) {
      setErrorModal("Unable to resend code");
      setTimeout(() => setErrorModal(null), 3000);
    }
  };

  const clearCode = () => { setCode(['', '', '', '', '', '']); focusInput(0); };

  return (
    <>
    <div className={styles.verificationContainer}>
      <button onClick={onBack} className={styles.backButton} type="button">Back to Sign Up</button>

      <div className={styles.header}>
        <div className={styles.iconContainer}><i className="fas fa-envelope-open-text"></i></div>
        <h2 className={styles.title}>Verify Your Email</h2>
        <p className={styles.description}>We've sent a 6-digit verification code to <strong>{email}</strong></p>
      </div>

      <div className={styles.codeInputContainer}>
        <div className={styles.codeInputs}>
          {code.map((digit, i) => (
            <input
              key={i}
              ref={el => inputsRef.current[i] = el}
              type="text"
              inputMode="numeric"
              maxLength="1"
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={i === 0 ? handlePaste : undefined}
              className={`${styles.codeInput} ${digit ? styles.filled : ''}`}
              autoFocus={i === 0}
            />
          ))}
        </div>

        <div className={styles.actionsRow}>
          <button onClick={() => handleSubmit()} className={styles.verifyButton} disabled={isLoading || code.some(d => !d)}>
            {isLoading ? "Verifying..." : "Verify & Create Account"}
          </button>
          <button onClick={clearCode} className={styles.clearButton}>Clear Code</button>
          <div className={styles.resendContainer}>
            {countdown > 0 ? <span>Resend in {countdown}s</span> :
              <button onClick={handleResendCode} className={styles.resendButton}>Resend Code</button>}
          </div>
        </div>
      </div>
    </div>

    {errorModal && <BottomRightErrorModal message={errorModal} />}

    {/* Full-page white overlay + centered spinner when verification finalizes */}
    {showOverlay && (
      <div style={{
        position: "fixed", inset: 0, backgroundColor: "white", display: "flex",
        alignItems: "center", justifyContent: "center", zIndex: 9999
      }}>
        <div style={{ textAlign: "center" }}>
          <div className={styles.centerSpinner}></div>
          <p style={{ marginTop: 16, fontSize: 18 }}>Account created — redirecting...</p>
        </div>
      </div>
    )}
    </>
  );
}
