import React from 'react';
import styles from './CreateExamLinks.module.css';

export default function CreateExamLinks() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          <span className={styles.titleIcon}>📚</span>
          Create Exams
        </h3>
        <p className={styles.subtitle}>Choose your exam creation method</p>
      </div>
      
      <div className={styles.grid}>
        {/* Quick Exam Card */}
        <a href="/admin/exams/create/ati/" className={`${styles.linkCard} ${styles.quickExam}`}>
          <div className={styles.cardContent}>
            <span className={styles.linkIcon}>📝</span>
            <div className={styles.linkContent}>
              <span className={styles.linkTitle}>ATI TEAS 7 Exam</span>
              <span className={styles.linkDesc}>Create a basic ATI Teas exam in minutes</span>
            </div>
            <span className={styles.arrow}>→</span>
          </div>
          <div className={styles.hoverEffect}></div>
        </a>

        {/* Template Card */}
        <a href="/admin/exams/create/hesi/" className={`${styles.linkCard} ${styles.template}`}>
          <div className={styles.cardContent}>
            <span className={styles.linkIcon}>📝</span>
            <div className={styles.linkContent}>
              <span className={styles.linkTitle}>HESI A2 Exam</span>
              <span className={styles.linkDesc}>Create a basic HESI exam in minutes</span>
            </div>
            <span className={styles.arrow}>→</span>
          </div>
          <div className={styles.hoverEffect}></div>
        </a>

        {/* Advanced Card */}
        <a href="/admin/exams/create/nclexrn/" className={`${styles.linkCard} ${styles.advanced}`}>
          <div className={styles.cardContent}>
            <span className={styles.linkIcon}>📝</span>
            <div className={styles.linkContent}>
              <span className={styles.linkTitle}>NCLEX RN Exam</span>
              <span className={styles.linkDesc}>Create a basic NCLEX exam in minutes</span>
            </div>
            <span className={styles.arrow}>→</span>
          </div>
          <div className={styles.hoverEffect}></div>
        </a>

        {/* Timed Exam Card */}
        <a href="/admin/exams/create/nclexpn/" className={`${styles.linkCard} ${styles.timedExam}`}>
          <div className={styles.cardContent}>
           <span className={styles.linkIcon}>📝</span>
            <div className={styles.linkContent}>
              <span className={styles.linkTitle}>NCLEX PN Exam</span>
              <span className={styles.linkDesc}>Create a basic NCLEX exam in minutes</span>
            </div>
            <span className={styles.arrow}>→</span>
          </div>
          <div className={styles.hoverEffect}></div>
        </a>

        {/* Practice Test Card */}
        <a href="/admin/exams/create/rn/" className={`${styles.linkCard} ${styles.practiceTest}`}>
          <div className={styles.cardContent}>
            <span className={styles.linkIcon}>📝</span>
            <div className={styles.linkContent}>
              <span className={styles.linkTitle}>RN Nursing Exams</span>
              <span className={styles.linkDesc}>Create a basic RN exam in minutes</span>
            </div>
            <span className={styles.arrow}>→</span>
          </div>
          <div className={styles.hoverEffect}></div>
        </a>

        {/* Graded Exam Card */}
        <a href="/admin/exams/create/lpn/" className={`${styles.linkCard} ${styles.gradedExam}`}>
          <div className={styles.cardContent}>
            <span className={styles.linkIcon}>📝</span>
            <div className={styles.linkContent}>
              <span className={styles.linkTitle}>LPN Nursing Exams</span>
              <span className={styles.linkDesc}>Create a basic LPN exam in minutes</span>
            </div>
            <span className={styles.arrow}>→</span>
          </div>
          <div className={styles.hoverEffect}></div>
        </a>
      </div>
    </div>
  );
}