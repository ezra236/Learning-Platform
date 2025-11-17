// frontend/src/components/AdminSignupForm/AdminSignupForm.js
'use client';
import { useState } from 'react';
import styles from './AdminSignupForm.module.css';
import { getCookie } from '@/lib/cookies';
import BottomRightSuccessModal from '../BottomRightSuccessModal/BottomRightSuccessModal';
import BottomRightErrorModal from '../BottomRightErrorModal/BottomRightErrorModal';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export default function AdminSignupForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [successModal, setSuccessModal] = useState(null);
  const [errorModal, setErrorModal] = useState(null);

  const validatePassword = (password) => {
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[@$!%*?&]/.test(password);
    const isLong = password.length >= 8;

    const score = [hasLower, hasUpper, hasNumber, hasSpecial, isLong].filter(Boolean).length;
    
    if (score >= 4) return 'strong';
    if (score >= 3) return 'medium';
    return 'weak';
  };

  const getPasswordStrengthInfo = (strength) => {
    switch (strength) {
      case 'strong': 
        return { 
          text: 'Strong Password', 
          color: '#10b981',
          width: '100%',
          icon: 'fas fa-check-circle'
        };
      case 'medium': 
        return { 
          text: 'Medium Password', 
          color: '#f59e0b',
          width: '66%',
          icon: 'fas fa-exclamation-circle'
        };
      case 'weak': 
        return { 
          text: 'Weak Password', 
          color: '#ef4444',
          width: '33%',
          icon: 'fas fa-times-circle'
        };
      default: 
        return { 
          text: '', 
          color: '#e5e7eb',
          width: '0%',
          icon: ''
        };
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'password') {
      const strength = validatePassword(value);
      setPasswordStrength(strength);
    }

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
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
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      // ensure CSRF cookie is set
      await fetch(`${API_BASE}/api/csrf/`, { credentials: "include" });

      const csrftoken = getCookie('csrftoken');

      const resp = await fetch(`${API_BASE}/api/superadmin/signup/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrftoken || "",
        },
        body: JSON.stringify({ email: formData.email, password: formData.password }),
      });

      const data = await resp.json();
      setIsLoading(false);

      if (!resp.ok) {
        setErrorModal(data.error || "Unable to send verification code");
        setTimeout(() => setErrorModal(null), 5000);
        return;
      }

      // success — show success modal (bottom-right) and call parent to show verification UI
      setSuccessModal("Verification code sent to your email");
      setTimeout(() => setSuccessModal(null), 4000);

      if (typeof onSubmit === "function") {
        onSubmit({ email: formData.email, password: formData.password });
      }
    } catch (err) {
      setIsLoading(false);
      setErrorModal(err.message || "Network error");
      setTimeout(() => setErrorModal(null), 5000);
    }
  };

  const strengthInfo = getPasswordStrengthInfo(passwordStrength);

  return (
    <>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.header}>
          <h2 className={styles.title}>Create Admin Account</h2>
          <p className={styles.subtitle}>Join the Rushhourcamp team</p>
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
              placeholder="Create a strong password"
            />
            <i className={`fas fa-lock ${styles.inputIcon}`}></i>
            <button
              type="button"
              className={styles.passwordToggle}
              onClick={() => setShowPassword(!showPassword)}
            >
              <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </button>
          </div>
          {formData.password && (
            <div className={styles.passwordStrength}>
              <div className={styles.strengthBar}>
                <div 
                  className={styles.strengthFill}
                  style={{
                    backgroundColor: strengthInfo.color,
                    width: strengthInfo.width
                  }}
                ></div>
              </div>
              <div className={styles.strengthInfo}>
                {strengthInfo.icon && (
                  <i className={strengthInfo.icon} style={{ color: strengthInfo.color }}></i>
                )}
                <span 
                  className={styles.strengthText}
                  style={{ color: strengthInfo.color }}
                >
                  {strengthInfo.text}
                </span>
              </div>
            </div>
          )}
          {errors.password && (
            <span className={styles.errorText}>
              <i className="fas fa-exclamation-circle"></i>
              {errors.password}
            </span>
          )}
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="confirmPassword" className={styles.label}>
            <i className="fas fa-check-double"></i>
            Confirm Password
          </label>
          <div className={styles.inputWrapper}>
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ''}`}
              placeholder="Confirm your password"
            />
            <i className={`fas fa-check-double ${styles.inputIcon}`}></i>
            <button
              type="button"
              className={styles.passwordToggle}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </button>
          </div>
          {errors.confirmPassword && (
            <span className={styles.errorText}>
              <i className="fas fa-exclamation-circle"></i>
              {errors.confirmPassword}
            </span>
          )}
        </div>

        <button 
          type="submit" 
          className={`${styles.submitButton} ${isLoading ? styles.loading : ''}`}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <div className={styles.spinner}></div>
              Creating Account...
            </>
          ) : (
            <>
              <i className="fas fa-user-plus"></i>
              Create Admin Account
            </>
          )}
        </button>

        <div className={styles.requirements}>
          <p className={styles.requirementsTitle}>
            <i className="fas fa-list-alt"></i>
            Password Requirements:
          </p>
          <ul className={styles.requirementsList}>
            <li className={formData.password.length >= 8 ? styles.requirementMet : ''}>
              <i className={`fas ${formData.password.length >= 8 ? 'fa-check' : 'fa-circle'}`}></i>
              At least 8 characters
            </li>
            <li className={/[a-z]/.test(formData.password) ? styles.requirementMet : ''}>
              <i className={`fas ${/[a-z]/.test(formData.password) ? 'fa-check' : 'fa-circle'}`}></i>
              One lowercase letter
            </li>
            <li className={/[A-Z]/.test(formData.password) ? styles.requirementMet : ''}>
              <i className={`fas ${/[A-Z]/.test(formData.password) ? 'fa-check' : 'fa-circle'}`}></i>
              One uppercase letter
            </li>
            <li className={/\d/.test(formData.password) ? styles.requirementMet : ''}>
              <i className={`fas ${/\d/.test(formData.password) ? 'fa-check' : 'fa-circle'}`}></i>
              One number
            </li>
            <li className={/[@$!%*?&]/.test(formData.password) ? styles.requirementMet : ''}>
              <i className={`fas ${/[@$!%*?&]/.test(formData.password) ? 'fa-check' : 'fa-circle'}`}></i>
              One special character
            </li>
          </ul>
        </div>
      </form>

      {successModal && <BottomRightSuccessModal message={successModal} />}
      {errorModal && <BottomRightErrorModal message={errorModal} />}
    </>
  );
}
