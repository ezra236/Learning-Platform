import React from "react";
import styles from "./Explore.module.css";

const examPathForPlan = (plan) => {
  if (!plan) return "/user/plans/";
  return "/user/plans/";
};

function getPlanIcon(examType) {
  switch (examType) {
    case "ATI_TEAS_7":
      return "📊";
    case "HESI_A2":
      return "🧪";
    case "NCLEX":
      return "🩺";
    case "NURSING_TEST_BANK":
      return "📚";
    case "EXIT_EXAM":
      return "🎓";
    default:
      return "⭐";
  }
}

function getPlanColor(examType) {
  switch (examType) {
    case "ATI_TEAS_7":
      return "#3b82f6";
    case "HESI_A2":
      return "#10b981";
    case "NCLEX":
      return "#ef4444";
    case "NURSING_TEST_BANK":
      return "#8b5cf6";
    case "EXIT_EXAM":
      return "#f59e0b";
    default:
      return "#6b7280";
  }
}

function getPlanGradient(examType) {
  switch (examType) {
    case "ATI_TEAS_7":
      return "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)";
    case "HESI_A2":
      return "linear-gradient(135deg, #10b981 0%, #047857 100%)";
    case "NCLEX":
      return "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)";
    case "NURSING_TEST_BANK":
      return "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)";
    case "EXIT_EXAM":
      return "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)";
    default:
      return "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)";
  }
}

export default function Explore({ plans = [] }) {
  if (!plans || plans.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🔍</div>
          <h3>No Additional Plans Available</h3>
          <p>We're constantly adding new learning opportunities. Check back soon!</p>
          <button className={styles.notifyButton}>
            🔔 Notify Me
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>🌍 Explore More Learning Plans</h2>
        <p className={styles.subtitle}>Expand your knowledge with our comprehensive study resources</p>
      </div>
      
      <div className={styles.grid}>
        {plans.map((p) => {
          const icon = getPlanIcon(p.exam_type);
          const color = getPlanColor(p.exam_type);
          const gradient = getPlanGradient(p.exam_type);
          const isFree = parseFloat(p.price || 0) === 0;
          
          return (
            <div 
              key={p.id} 
              className={styles.card}
              style={{ '--plan-color': color, '--plan-gradient': gradient }}
            >
              <div className={styles.cardHeader}>
                <div className={styles.cardIcon} style={{ background: gradient }}>
                  {icon}
                </div>
                <div className={styles.cardBadges}>
                  {isFree && <span className={styles.freeBadge}>FREE</span>}
                  <span className={styles.durationBadge}>{p.duration_days} days</span>
                </div>
              </div>

              <div className={styles.cardContent}>
                <h4 className={styles.planTitle}>{p.title || p.exam_type}</h4>
                <span className={styles.examType}>{p.exam_type}</span>
                
                <div className={styles.features}>
                  <div className={styles.feature}>
                    <span className={styles.featureIcon}>📖</span>
                    <span>Comprehensive Study Materials</span>
                  </div>
                  <div className={styles.feature}>
                    <span className={styles.featureIcon}>🎯</span>
                    <span>Practice Exams & Quizzes</span>
                  </div>
                  <div className={styles.feature}>
                    <span className={styles.featureIcon}>📊</span>
                    <span>Progress Analytics</span>
                  </div>
                  <div className={styles.feature}>
                    <span className={styles.featureIcon}>🔄</span>
                    <span>24/7 Access</span>
                  </div>
                </div>
              </div>

              <div className={styles.cardFooter}>
                <div className={styles.pricing}>
                  <div className={styles.price}>
                    {isFree ? (
                      <span className={styles.freePrice}>Completely Free</span>
                    ) : (
                      <>
                        <span className={styles.currency}>{p.currency}</span>
                        <span className={styles.amount}>{parseFloat(p.price || 0).toFixed(2)}</span>
                      </>
                    )}
                  </div>
                  <div className={styles.priceSubtitle}>
                    {isFree ? 'No credit card required' : 'One-time payment'}
                  </div>
                </div>
                
                <div className={styles.actions}>
                  <a 
                    className={styles.getBtn} 
                    href={examPathForPlan(p)}
                    style={{ background: gradient }}
                  >
                    <span className={styles.btnIcon}>✨</span>
                    Get Started
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className={styles.footerNote}>
        <span className={styles.footerIcon}>💡</span>
        <span>All plans include full access to study materials and customer support</span>
      </div>
    </div>
  );
}