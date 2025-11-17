'use client';
import { useState } from 'react';
import styles from './AdminSignupCard.module.css';
import AdminSignupForm from '../AdminSignupForm/AdminSignupForm';
import VerificationCode from '../VerificationCode/VerificationCode';

export default function AdminSignupCard() {
  const [showVerification, setShowVerification] = useState(false);
  const [formData, setFormData] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleFormSubmit = (data) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setFormData(data);
      setShowVerification(true);
      setIsTransitioning(false);
    }, 500);
  };

  const handleBackToForm = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setShowVerification(false);
      setIsTransitioning(false);
    }, 500);
  };

  return (
    <div className={styles.card}>
      <div className={`${styles.leftSection} ${isTransitioning ? styles.slideOut : ''}`}>
        <div className={styles.formContainer}>
          {!showVerification ? (
            <AdminSignupForm onSubmit={handleFormSubmit} />
          ) : (
            <VerificationCode 
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
              alt="Nursing Education" 
            />
            </div>
            <h1 className={styles.heading}>Rushhourcamp</h1>
          </div>
          <p className={styles.description}>
            Your premier nursing exam preparation platform. Join our admin team to help 
            aspiring nurses achieve their dreams with quality educational content and 
            comprehensive exam preparation resources.
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