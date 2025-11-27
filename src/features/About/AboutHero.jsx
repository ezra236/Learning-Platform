'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './AboutHero.module.css';

const AboutHero = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleStartLearning = () => {
    setLoading(true);
    setTimeout(() => {
      router.push('/user/signup/');
    }, 1000);
  };

  return (
    <section className={styles.hero}>
      <div className={styles.container}>
        <div className={styles.heroContent}>
          <div className={styles.textContent}>
            <div className={styles.logoSection}>
              <img src="/bv.png" alt="Rushhourcamp" className={styles.logo} />
              <h1 className={styles.title}>About Rushhourcamp</h1>
            </div>
            <p className={styles.subtitle}>
              Empowering the next generation of nursing professionals with 
              cutting-edge exam preparation technology and comprehensive 
              learning resources trusted by thousands of students worldwide.
            </p>
            <div className={styles.stats}>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>10,000+</span>
                <span className={styles.statLabel}>Students Empowered</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>95%</span>
                <span className={styles.statLabel}>Success Rate</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>24/7</span>
                <span className={styles.statLabel}>Learning Support</span>
              </div>
            </div>
            <div className={styles.ctaButtons}>
              <button 
                className={styles.primaryBtn} 
                onClick={handleStartLearning}
                disabled={loading}
              >
                {loading ? 'Redirecting...' : 'Start Learning Today 📚'}
              </button>
            </div>
          </div>
          <div className={styles.imageContent}>
            <img 
              src="/n.jpeg" 
              alt="Nursing student studying" 
              className={styles.heroImage}
            />
            <div className={styles.floatingBadges}>
              <div className={styles.badge}>
                <span className={styles.badgeIcon}>⭐</span>
                <span>Rated 4.9/5</span>
              </div>
              <div className={styles.badge}>
                <span className={styles.badgeIcon}>🏆</span>
                <span>Top Platform</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutHero;