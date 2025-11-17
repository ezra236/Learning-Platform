import React from 'react';
import styles from '@/styles/NursingResources.module.css';

const NursingResources = () => {
  const resources = [
    {
      name: "ATI TEAS",
      description: "Comprehensive guides for nursing school entrance exams"
    },
    {
      name: "Nursing Testbanks",
      description: "Extensive question banks for various nursing courses"
    },
    {
      name: "NCLEX",
      description: "Proven materials to help you pass the licensing exam"
    },
    {
      name: "HESI A2",
      description: "Targeted preparation for health education systems exam"
    }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        <div className={styles.imageSection}>
          <img 
            src="/cr.jpeg" 
            alt="Nursing Study Resources" 
            className={styles.resourceImage}
          />
          <div className={styles.imageOverlay}></div>
        </div>
        
        <div className={styles.contentSection}>
          <div className={styles.header}>
            <h2 className={styles.title}>Excel in Your Nursing Career</h2>
            <p className={styles.subtitle}>
              Premium Study Resources for Aspiring Nurses
            </p>
          </div>
          
          <p className={styles.description}>
            Access our comprehensive collection of premium PDF resources designed to help you 
            succeed in every step of your nursing journey. From entrance exams to final 
            certifications, we've got you covered with up-to-date, high-quality materials.
          </p>
          
          <div className={styles.resourcesGrid}>
            {resources.map((resource, index) => (
              <div key={index} className={styles.resourceItem}>
                <div className={styles.resourceIcon}>📚</div>
                <div className={styles.resourceContent}>
                  <h3 className={styles.resourceName}>{resource.name}</h3>
                  <p className={styles.resourceDesc}>{resource.description}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className={styles.ctaSection}>
            <a href="/rushhour/pdf/" className={styles.ctaButton}>
              <span className={styles.buttonText}>Explore All Resources</span>
              <span className={styles.buttonArrow}>→</span>
            </a>
            <p className={styles.ctaNote}>
              Instant access • Regularly updated • Money-back guarantee
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NursingResources;