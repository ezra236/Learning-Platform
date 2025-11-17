// HeroSection.jsx
import React from 'react';
import styles from "../../styles/hero.module.css";

const Herosection = () => {
  return (
    <section className={styles.hero}>
      <div className={styles.container}>
        {/* Left Section */}
        <div className={styles.leftSection}>
          <p className={styles.heading}><span>Rushhourcamp</span> is your key to mastering <span>nursing school</span> content</p>
          <p className={styles.subheading}>
            Start with <span>Rushhourcamp</span> to improve your grades and knowledge. Our comprehensive resources and expert guidance will help you excel in your <span>nursing </span> journey.
          </p>
          <div className={styles.buttonGrid}>
            <a href="/rushhour/atiteas7" className={styles.button}>ATI TEAS 7</a>
            <a href="/rushhour/rn-nursingtestbank" className={styles.button}>RN - NursingTestBank</a>
            <a href="/rushhour/lpn-nursingtestbank" className={styles.button}>LPN - NursingTestBank</a>
            <a href="/rushhour/hesia2" className={styles.button}>HESI A2</a>
            <a href="/rushhour/nclex-rn" className={styles.button}>NCLEX - RN</a>
            <a href="/rushhour/nclex-pn" className={styles.button}>NCLEX - PN</a>
            <a href="/rushhour/exitexams" className={styles.button}>EXIT EXAMS</a>
          </div>
        </div>

        {/* Right Section */}
        <div className={styles.rightSection}>
          <img 
            src="/s.png" 
            alt="Hero Illustration"
            className={styles.heroImage}
          />
        </div>
      </div>
    </section>
  );
};

export default Herosection;