"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./AboutCTA.module.css";

const AboutCTA = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [buttonClicked, setButtonClicked] = useState(null);

  const handleClick = (path, buttonType) => {
    setLoading(true);
    setButtonClicked(buttonType);

    // Simulate slight delay before redirect for smoother UX
    setTimeout(() => {
      router.push(path);
    }, 800);
  };

  return (
    <section className={styles.cta}>
      <div className={styles.container}>
        <div className={styles.ctaContent}>
          <div className={styles.textSection}>
            <h2 className={styles.ctaTitle}>Ready to Excel in Your Nursing Career?</h2>
            <p className={styles.ctaDescription}>
              Join thousands of successful nursing students who have transformed 
              their exam preparation with Rushhourcamp. Start your journey to 
              academic excellence today.
            </p>
            
            <div className={styles.featureGrid}>
              <div className={styles.feature}>
                <span className={styles.featureIcon}>🎯</span>
                <span>Personalized Learning Paths</span>
              </div>
              <div className={styles.feature}>
                <span className={styles.featureIcon}>📊</span>
                <span>Smart Progress Tracking</span>
              </div>
              <div className={styles.feature}>
                <span className={styles.featureIcon}>🏆</span>
                <span>Proven Success Results</span>
              </div>
              <div className={styles.feature}>
                <span className={styles.featureIcon}>💼</span>
                <span>Career-Focused Content</span>
              </div>
            </div>
          </div>
          
          <div className={styles.actionSection}>
            <div className={styles.ctaCard}>
              <h3 className={styles.cardTitle}>Start Your Success Journey</h3>
              <p className={styles.cardText}>Choose your plan and begin your transformation today</p>
              
              <div className={styles.ctaButtons}>
                {/* First Button */}
                <button
                  className={styles.primaryBtn}
                  onClick={() => handleClick("/user/signup/", "primary")}
                  disabled={loading}
                >
                  {loading && buttonClicked === "primary" ? (
                    <span>⏳ Redirecting...</span>
                  ) : (
                    <>
                      <span className={styles.btnIcon}>🚀</span>
                      Get Started Free
                      <span className={styles.btnSubtext}>7-day trial</span>
                    </>
                  )}
                </button>

                {/* Second Button */}
                <button
                  className={styles.secondaryBtn}
                  onClick={() => handleClick("/rushhour/courses/", "secondary")}
                  disabled={loading}
                >
                  {loading && buttonClicked === "secondary" ? (
                    <span>⏳ Redirecting...</span>
                  ) : (
                    <>
                      <span className={styles.btnIcon}>📚</span>
                      View Plans
                      <span className={styles.btnSubtext}>Flexible options</span>
                    </>
                  )}
                </button>
              </div>
              
              <div className={styles.trustIndicators}>
                <div className={styles.trustItem}>
                  <span className={styles.trustIcon}>🔒</span>
                  <span>Secure & Private</span>
                </div>
                <div className={styles.trustItem}>
                  <span className={styles.trustIcon}>⭐</span>
                  <span>4.9/5 Rating</span>
                </div>
                <div className={styles.trustItem}>
                  <span className={styles.trustIcon}>👥</span>
                  <span>10,000+ Students</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutCTA;
