'use client';
import { useState } from 'react';
import Link from 'next/link';
import SignInSuccessModal from './SignInSuccessModal';
import styles from './signinform.module.css';

const API_BASE = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_BASE_URL) || '';

// Helper to read cookie value (simple)
function getCookie(name) {
  const match = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
  return match ? match.pop() : '';
}

/**
 * Ensure CSRF cookie is present by hitting the CSRF endpoint (which sets csrftoken cookie).
 * Assumes you register CsrfTokenView at `${API_BASE}/api/auth/csrf/`.
 */
async function ensureCsrfCookie() {
  if (getCookie('csrftoken')) return;
  try {
    await fetch(`${API_BASE}/api/auth/csrf/`, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
  } catch (err) {
    // ignore; subsequent POST will fail if CSRF missing
  }
}

export default function SigninForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    // placeholder behaviour — you might redirect to a forgot password page
    alert('Password reset feature coming soon!');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    // ensure csrf cookie exists (cross-origin setups)
    await ensureCsrfCookie();

    try {
      const resp = await fetch(`${API_BASE}/api/signin/`, {
        method: 'POST',
        credentials: 'include', // include cookies so Django session cookie is set
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken'),
        },
        body: JSON.stringify({
          email: formData.email.toLowerCase(),
          password: formData.password,
          remember_me: rememberMe, // optional; backend may ignore
        }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        // propagate backend validation / error messages
        const msg = data.detail || (data.errors && JSON.stringify(data.errors)) || 'Sign in failed.';
        setErrors({ form: msg });
        setIsLoading(false);
        return;
      }

      // success
      setShowSuccess(true);

      // redirect after a short delay so users see the modal
      setTimeout(() => {
        const redirectTo = data.redirect || '/user/dashboard/';
        // if redirect is absolute, navigate to it directly; otherwise use relative
        window.location.href = redirectTo.startsWith('http') ? redirectTo : redirectTo;
      }, 2000);
    } catch (err) {
      console.error('Sign-in error:', err);
      setErrors({ form: 'Network error or server unreachable.' });
      setIsLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.header}>
          <h2 className={styles.title}>Welcome Back</h2>
          <p className={styles.subtitle}>Sign in to your user account</p>
        </div>

        {errors.form && <div className={styles.formError}>{errors.form}</div>}

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
              type={showPassword ? 'text' : 'password'}
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
              aria-label={showPassword ? 'Hide password' : 'Show password'}
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

          <button type="button" className={styles.forgotPassword} onClick={handleForgotPassword}>
            Forgot Password?
          </button>
        </div>

        <button type="submit" className={`${styles.submitButton} ${isLoading ? styles.loading : ''}`} disabled={isLoading}>
          {isLoading ? (
            <>
              <div className={styles.spinner} />
              Signing In...
            </>
          ) : (
            <>
              <i className="fas fa-sign-in-alt" />
              Sign In
            </>
          )}
        </button>

        <div className={styles.signupLink}>
          <p>
            Don't have an account?{' '}
            <Link href="/user/signup" className={styles.link}>
              Create one here
            </Link>
          </p>
        </div>
      </form>

      {/* Bottom-left success modal */}
      <SignInSuccessModal visible={showSuccess} />
    </>
  );
}
