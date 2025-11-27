import React from 'react';
import styles from './ModifyExamLinks.module.css';

export default function ModifyExamLinks() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          <span className={styles.titleIcon}>🔧</span>
          Modify Exams
        </h3>
        <p className={styles.subtitle}>Manage and update existing exams</p>
      </div>
      
      <div className={styles.grid}>
        {/* Edit Exam Card */}
        <a href="/admin/exams/modify/ati/" className={`${styles.linkCard} ${styles.editExam}`}>
          <div className={styles.cardContent}>
            <span className={styles.linkIcon}>✏️</span>
            <div className={styles.linkContent}>
              <span className={styles.linkTitle}>Edit ATI TEAS 7 Exam</span>
              <span className={styles.linkDesc}>Modify existing exam content</span>
            </div>
            <span className={styles.arrow}>→</span>
          </div>
          <div className={styles.hoverEffect}></div>
        </a>

        {/* Update Version Card */}
        <a href="/admin/exams/modify/hesi/" className={`${styles.linkCard} ${styles.updateVersion}`}>
          <div className={styles.cardContent}>
            <span className={styles.linkIcon}>✏️</span>
            <div className={styles.linkContent}>
              <span className={styles.linkTitle}>Edit HESI A2 Exam</span>
              <span className={styles.linkDesc}>Modify existing exam content</span>
            </div>
            <span className={styles.arrow}>→</span>
          </div>
          <div className={styles.hoverEffect}></div>
        </a>

        {/* Manage Questions Card */}
        <a href="/admin/exams/modify/nclexrn/" className={`${styles.linkCard} ${styles.manageQuestions}`}>
          <div className={styles.cardContent}>
            <span className={styles.linkIcon}>✏️</span>
            <div className={styles.linkContent}>
              <span className={styles.linkTitle}>Edit NCLEX RN Exam</span>
              <span className={styles.linkDesc}>Modify existing exam content</span>
            </div>
            <span className={styles.arrow}>→</span>
          </div>
          <div className={styles.hoverEffect}></div>
        </a>

        {/* Edit Metadata Card */}
        <a href="/admin/exams/modify/nclexpn/" className={`${styles.linkCard} ${styles.editMetadata}`}>
          <div className={styles.cardContent}>
            <span className={styles.linkIcon}>✏️</span>
            <div className={styles.linkContent}>
              <span className={styles.linkTitle}>Edit NCLEX PN Exam</span>
              <span className={styles.linkDesc}>Modify existing exam content</span>
            </div>
            <span className={styles.arrow}>→</span>
          </div>
          <div className={styles.hoverEffect}></div>
        </a>

        {/* Review Content Card */}
        <a href="/admin/exams/modify/nursingtestbank/RN/ati" className={`${styles.linkCard} ${styles.reviewContent}`}>
          <div className={styles.cardContent}>
            <span className={styles.linkIcon}>✏️</span>
            <div className={styles.linkContent}>
              <span className={styles.linkTitle}>Edit RN NursingTestbank for ati</span>
              <span className={styles.linkDesc}>Modify existing exam content</span>
            </div>
            <span className={styles.arrow}>→</span>
          </div>
          <div className={styles.hoverEffect}></div>
        </a>

        {/* Preview Exam Card */}
        <a href="/admin/exams/modify/nursingtestbank/RN/hesi" className={`${styles.linkCard} ${styles.previewExam}`}>
          <div className={styles.cardContent}>
            <span className={styles.linkIcon}>✏️</span>
            <div className={styles.linkContent}>
              <span className={styles.linkTitle}>Edit RN Nursing TestBank for hesi</span>
              <span className={styles.linkDesc}>Modify existing exam content</span>
            </div>
            <span className={styles.arrow}>→</span>
          </div>
          <div className={styles.hoverEffect}></div>
        </a>
      </div>
    </div>
  );
}