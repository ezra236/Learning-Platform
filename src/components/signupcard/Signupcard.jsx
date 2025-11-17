'use client';
import { useState } from 'react';
import styles from './signupcard.module.css';
import SignupForm from '../signupform/SignForm';
import Verification from '../verfication/Verification';

export default function SignupCard() {
  const [showVerification, setShowVerification] = useState(false);
  const [formData, setFormData] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleFormSubmit = async (data) => {
    // call backend signup endpoint
    setIsTransitioning(true);
    try {
      // perform signup (frontend SignForm already calls API, so here we just set UI)
      setFormData({ email: data.email });
      // show verification UI (SignForm triggers API itself; if you want to do API here instead
      // move the fetch to this handler. Both approaches are valid; our SignForm uses local fetch.)
      setShowVerification(true);
    } finally {
      setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
    }
  };

  const handleBackToForm = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setShowVerification(false);
      setIsTransitioning(false);
    }, 300);
  };

  return (
    <div className={styles.card}>
      <div className={`${styles.leftSection} ${isTransitioning ? styles.slideOut : ''}`}>
        <div className={styles.formContainer}>
          {!showVerification ? (
            <SignupForm onSubmit={handleFormSubmit} />
          ) : (
            <Verification
              email={formData?.email}
              onBack={handleBackToForm}
            />
          )}
        </div>
      </div>
      
      <div className={styles.rightSection}>
        <div className={styles.rightContent}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>
              <img 
                src="/bv.png" 
                alt="RushHourCamp Logo" 
              />
            </div>
            <h1 className={styles.heading}>Rushhourcamp</h1>
          </div>
          <p className={styles.description}>
            Accelerate your nursing career with RushHourCamp. Gain access to expertly crafted study materials, interactive practice exams, and personalized guidance designed to help you pass your nursing exams with confidence and efficiency.
          </p>
          <div className={styles.imageContainer}>
            <img 
              src="/ks.jpeg" 
              alt="Nursing Education" 
              className={styles.image}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className={styles.imagePlaceholder}>
              <div className={styles.placeholderIcon}>
                <i className="fas fa-hospital-user"></i>
              </div>
              <span>Nursing Education</span>
            </div>
          </div>
          <div className={styles.features}>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>
                <i className="fas fa-book-medical"></i>
              </div>
              <span>Study Materials</span>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>
                <i className="fas fa-bullseye"></i>
              </div>
              <span>Exam Focused</span>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>
                <i className="fas fa-user-md"></i>
              </div>
              <span>Expert Guidance</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
