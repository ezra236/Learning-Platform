'use client';
import { useState } from 'react';
import styles from './AdminSigninCard.module.css';
import AdminSigninForm from '../AdminSigninForm/AdminSigninForm';

export default function AdminSigninCard() {
  return (
    <div className={styles.card}>
      <div className={styles.leftSection}>
        <div className={styles.formContainer}>
          <AdminSigninForm />
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
            Welcome back to your premier nursing exam preparation platform. 
            Continue your journey to help aspiring nurses achieve their dreams 
            with quality educational content.
          </p>
          <div className={styles.imageContainer}>
            <img 
              src="/a.jpeg" 
              alt="Nursing Education" 
              className={styles.image}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className={styles.imagePlaceholder}>
              <div className={styles.placeholderIcon}>
                <i className="fas fa-user-nurse"></i>
              </div>
              <span>Welcome Back</span>
            </div>
          </div>
          <div className={styles.features}>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>
                <i className="fas fa-chart-line"></i>
              </div>
              <span>Track Progress</span>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>
                <i className="fas fa-users"></i>
              </div>
              <span>Manage Students</span>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>
                <i className="fas fa-cogs"></i>
              </div>
              <span>Admin Tools</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}