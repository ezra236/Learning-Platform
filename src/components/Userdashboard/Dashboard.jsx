import React, { useEffect, useState } from "react";
import Explore from "./Exams/Explore/Explore";
import Blog from "./Exams/Blog/Blog";
import styles from "./dashboard.module.css";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

function getExamPathForPlan(plan) {
  const exam = (plan && plan.exam_type) || "";
  const price = parseFloat(plan.price || 0);
  if (price === 0) return "/user/exam/free/";
  switch (exam) {
    case "ATI_TEAS_7":
      return "/user/exam/ati/";
    case "HESI_A2":
      return "/user/exam/hesi/";
    case "NCLEX":
      return "/user/exam/nclex/";
    case "NURSING_TEST_BANK":
      return "/user/exam/testbank/";
    case "EXIT_EXAM":
      return "/user/exam/exit/";
    default:
      return "/user/exam/";
  }
}

function getExamIcon(examType) {
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
      return "📝";
  }
}

function getStatusBadge(startDate, finishDate) {
  const now = new Date();
  const start = new Date(startDate);
  const finish = new Date(finishDate);
  
  if (now < start) return { text: "🟡 Starting Soon", color: "#f59e0b" };
  if (now > finish) return { text: "🔴 Expired", color: "#ef4444" };
  
  const daysLeft = Math.ceil((finish - now) / (1000 * 60 * 60 * 24));
  if (daysLeft <= 7) return { text: "🟢 Active", color: "#10b981" };
  return { text: "🟢 Active", color: "#10b981" };
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [availablePlans, setAvailablePlans] = useState([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);

      try {
        const csrfResp = await fetch(`${API_BASE}/api/auth/csrf/`, {
          method: "GET",
          credentials: "include",
        });

        let csrfToken = null;
        if (csrfResp.ok) {
          try {
            const csrfJson = await csrfResp.json();
            csrfToken = csrfJson && csrfJson.csrfToken;
          } catch (e) {}
        }

        const headers = {};
        if (csrfToken) headers["X-CSRFToken"] = csrfToken;

        const resp = await fetch(`${API_BASE}/api/subscriptionsz/`, {
          method: "GET",
          credentials: "include",
          headers,
        });

        if (!resp.ok) {
          if (resp.status === 401) {
            throw new Error("Not authenticated. Please login.");
          } else if (resp.status === 403) {
            throw new Error("Access denied for current user.");
          } else {
            const txt = await resp.text();
            throw new Error(`Failed to fetch subscriptions: ${resp.status} ${txt}`);
          }
        }

        const data = await resp.json();
        if (!mounted) return;
        setSubscriptions(data.subscriptions || []);
        setAvailablePlans(data.available_plans || []);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || "Unknown error");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}>
          <div className={styles.spinnerInner}>⏳</div>
        </div>
        <p>Loading your subscriptions...</p>
        <span className={styles.loadingSubtitle}>Getting everything ready for you</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon}>⚠️</div>
        <h3>Something went wrong</h3>
        <p>{error}</p>
        <div className={styles.errorActions}>
          <button 
            className={styles.retryButton}
            onClick={() => window.location.reload()}
          >
            🔄 Try Again
          </button>
          <button 
            className={styles.secondaryButton}
            onClick={() => window.location.href = '/contact'}
          >
            📞 Get Help
          </button>
        </div>
      </div>
    );
  }

  if (!subscriptions || subscriptions.length === 0) {
    return <Blog />;
  }

  return (
    <div className={styles.container}>
      <section className={styles.subscriptionsSection}>
        <div className={styles.sectionHeader}>
          <h2>📚 Subscriptions</h2>
          <span className={styles.sectionBadge}>{subscriptions.length} plan(s)</span>
        </div>
        
        <div className={styles.subscriptionsGrid}>
          {subscriptions.map((s) => {
            const plan = s.plan || {};
            const link = getExamPathForPlan(plan);
            const icon = getExamIcon(plan.exam_type);
            const status = getStatusBadge(s.start_date, s.finish_date);
            const isActive = new Date(s.finish_date) > new Date();
            
            return (
              <div key={s.id} className={`${styles.subscriptionCard} ${!isActive ? styles.expiredCard : ''}`}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardIcon}>{icon}</div>
                  <div className={styles.cardTitle}>
                    <h3>{plan.title || plan.exam_type}</h3>
                    <span className={styles.examType}>{plan.exam_type}</span>
                  </div>
                  <div 
                    className={styles.statusBadge}
                    style={{ backgroundColor: status.color }}
                  >
                    {status.text}
                  </div>
                </div>
                
                <div className={styles.cardDetails}>
                  <div className={styles.detailRow}>
                    <div className={styles.detailItem}>
                      <span className={styles.detailIcon}>⏱️</span>
                      <div className={styles.detailContent}>
                        <span className={styles.detailLabel}>Duration</span>
                        <span className={styles.detailValue}>{plan.duration_days} days</span>
                      </div>
                    </div>
                    
                    <div className={styles.detailItem}>
                      <span className={styles.detailIcon}>💰</span>
                      <div className={styles.detailContent}>
                        <span className={styles.detailLabel}>Price</span>
                        <span className={styles.detailValue}>
                          {plan.price == 0 ? "Free" : `$${parseFloat(plan.price || 0).toFixed(2)}`}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {s.start_date && s.finish_date && (
                    <div className={styles.dateRange}>
                      <div className={styles.dateItem}>
                        <span className={styles.dateIcon}>📅</span>
                        <div className={styles.dateContent}>
                          <span className={styles.dateLabel}>Started</span>
                          <span className={styles.dateValue}>
                            {new Date(s.start_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className={styles.dateArrow}>→</div>
                      <div className={styles.dateItem}>
                        <span className={styles.dateIcon}>🏁</span>
                        <div className={styles.dateContent}>
                          <span className={styles.dateLabel}>Ends</span>
                          <span className={styles.dateValue}>
                            {new Date(s.finish_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className={styles.cardActions}>
                  <a href={link} className={styles.primaryButton}>
                    🚀 Go the Exam Dashboard
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className={styles.exploreSection}>
        <Explore plans={availablePlans} />
      </div>
    </div>
  );
}