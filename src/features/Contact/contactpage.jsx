import React from 'react';
import styles from './ContactPage.module.css';
import ContactHero from './ContactHero';
import ContactGrid from './ContactGrid';

const ContactPage = () => {
  return (
    <div className={styles.contactPage}>
      <ContactHero />
      <div className={styles.pageContent}>
        <ContactGrid />
      </div>
    </div>
  );
};

export default ContactPage;