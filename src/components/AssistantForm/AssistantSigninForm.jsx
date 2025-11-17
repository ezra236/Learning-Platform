// frontend/src/components/AdminSigninForm/AdminSigninForm.js
'use client';
import { useState } from 'react';
import styles from './AssistantSigninForm.module.css';
import Link from 'next/link';
import { getCookie } from '@/lib/cookies';
import { useRouter } from 'next/navigation';
import BottomRightSuccessModal from '@/components/BottomRightSuccessModal/BottomRightSuccessModal';
import BottomRightErrorModal from '@/components/BottomRightErrorModal/BottomRightErrorModal';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export default function AssistantSigninForm() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [showOverlaySpinner, setShowOverlaySpinner] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setRememberMe(checked);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Please enter a valid email address';
    if (!formData.password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      // ensure csrf cookie is present
      await fetch(`${API_BASE}/api/csrf/`, { credentials: 'include' });
      const csrftoken = getCookie('csrftoken');

      const resp = await fetch(`${API_BASE}/api/assistant/signin/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken || ''
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          remember_me: rememberMe
        })
      });

      const data = await resp.json();
      setIsLoading(false);

      if (!resp.ok) {
        setErrorMsg(data.error || 'Sign in failed');
        setTimeout(() => setErrorMsg(null), 5000);
        return;
      }

      // success: show overlay spinner for 3 seconds then redirect
      setSuccessMsg('Signed in — redirecting...');
      setShowOverlaySpinner(true);
      setTimeout(() => {
        router.push('/assistant/dashboard');
      }, 3000);

    } catch (err) {
      setIsLoading(false);
      setErrorMsg(err.message || 'Network error');
      setTimeout(() => setErrorMsg(null), 5000);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.header}>
          <h2 className={styles.title}>Welcome Back</h2>
          <p className={styles.subtitle}>Sign in to your Assistant account</p>
        </div>
        
        <div className={styles.inputGroup}>
          <label htmlFor="email" className={styles.label}>
            <i className="fas fa-envelope"></i>
            Email Address
          </label>
          <div className={styles.inputWrapper}>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
              placeholder="Enter your email address"
            />
            <i className={`fas fa-envelope ${styles.inputIcon}`}></i>
          </div>
          {errors.email && (
            <span className={styles.errorText}>
              <i className="fas fa-exclamation-circle"></i>
              {errors.email}
            </span>
          )}
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="password" className={styles.label}>
            <i className="fas fa-lock"></i>
            Password
          </label>
          <div className={styles.inputWrapper}>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
              placeholder="Enter your password"
            />
            <i className={`fas fa-lock ${styles.inputIcon}`}></i>
            <button
              type="button"
              className={styles.passwordToggle}
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </button>
          </div>
          {errors.password && (
            <span className={styles.errorText}>
              <i className="fas fa-exclamation-circle"></i>
              {errors.password}
            </span>
          )}
        </div>

        <div className={styles.options}>
          <label className={styles.rememberMe}>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className={styles.checkbox}
            />
            <span className={styles.checkmark}></span>
            Remember me
          </label>
          
          <button 
            type="button"
            className={styles.forgotPassword}
            onClick={(e) => { e.preventDefault(); alert('Password reset feature coming soon!'); }}
          >
            Forgot Password?
          </button>
        </div>

        <button 
          type="submit" 
          className={`${styles.submitButton} ${isLoading ? styles.loading : ''}`}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <div className={styles.spinner}></div>
              Signing In...
            </>
          ) : (
            <>
              <i className="fas fa-sign-in-alt"></i>
              Sign In
            </>
          )}
        </button>
      </form>

      {successMsg && <BottomRightSuccessModal message={successMsg} />}
      {errorMsg && <BottomRightErrorModal message={errorMsg} />}

      {/* Full page overlay spinner */}
      {showOverlaySpinner && (
        <div style={{ position: 'fixed', inset: 0, background: 'white', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div className={styles.centerSpinner}></div>
            <p style={{ marginTop: 12 }}>Signing in — redirecting...</p>
          </div>
        </div>
      )}
    </>
  );
}
