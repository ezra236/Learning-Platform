// components/Atiteas.jsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./PlanBoxes.module.css";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export default function Nclex() {
  const router = useRouter();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // track which plan button is loading (store plan id), null when none
  const [buttonLoading, setButtonLoading] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function fetchPlans() {
      try {
        const csrfRes = await fetch(`${BASE}/api/csrfs/`, {
          method: "GET",
        });

        if (!csrfRes.ok) {
          throw new Error(`Failed to fetch CSRF token (status ${csrfRes.status})`);
        }

        const csrfJson = await csrfRes.json();
        const token = csrfJson?.csrfToken || "";

        const plansRes = await fetch(`${BASE}/api/plans/nclex/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": token,
          },
        });

        if (!plansRes.ok) {
          throw new Error(`Failed to fetch plans (status ${plansRes.status})`);
        }

        const plansData = await plansRes.json();

        if (mounted) {
          setPlans(plansData);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || "Unknown error");
          setLoading(false);
        }
      }
    }

    fetchPlans();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return (
    <div className={styles.loadingContainer}>
      <div className={styles.spinner}>✨</div>
      <p className={styles.loadingText}>Loading Study Plans...</p>
    </div>
  );

  if (error) return (
    <div className={styles.errorContainer}>
      <div className={styles.errorIcon}>🌀</div>
      <h3 className={styles.errorTitle}>Oops! Something went wrong</h3>
      <p className={styles.errorMessage}>{error}</p>
      <button 
        className={styles.retryButton}
        onClick={() => window.location.reload()}
      >
        🔄 Try Again
      </button>
    </div>
  );

  if (!plans || plans.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>📚</div>
        <h3 className={styles.emptyTitle}>No Study Plans Available</h3>
        <p className={styles.emptyMessage}>Check back later for new  Nclex study plans!</p>
      </div>
    );
  }

  const handleGetStarted = (p) => {
    // prevent double clicks
    if (buttonLoading) return;

    setButtonLoading(p.id);

    // If you want to pass the plan id to signup page, append ?plan=${p.id}
    // router.push(`/rushhour/ati/signup?plan=${encodeURIComponent(p.id)}`);

    // Basic navigation:
    router.push("/user/signup");
    // Note: router.push will navigate away; state cleanup isn't strictly necessary,
    // but if you ever need to cancel the navigation or revert UI, handle it here.
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.sectionTitle}>🎯 NCLEX Study Plans</h2>
          <p className={styles.sectionSubtitle}>Choose your perfect preparation strategy for success</p>
        </div>
        
        <div className={styles.plansGrid}>
          {plans.map((p, index) => (
            <article key={p.id} className={`${styles.card} ${p.popular ? styles.popular : ''} ${styles[`card${index % 3}`]}`}>
              {p.popular && <div className={styles.badge}>🌟 Most Popular</div>}
              
              <header className={styles.cardHeader}>
                <h3 className={styles.title}>{p.title}</h3>
                <div className={styles.meta}>
                  <span className={styles.duration}>
                    📅 {p.duration_days} days
                  </span>
                  <span className={styles.price}>
                    💰 {p.currency} {p.price}
                  </span>
                </div>
              </header>

              <div className={styles.features}>
                <ul className={styles.featuresList}>
                  {p.features && p.features.length > 0
                    ? p.features.map((f) => (
                        <li key={f.id} className={styles.featureItem}>
                          ✅ {f.name}
                        </li>
                      ))
                    : <li className={styles.featureItem}>📝 Basic features included</li>
                  }
                </ul>
              </div>

              <footer className={styles.cardFooter}>
                <button 
                  className={`${styles.action} ${p.popular ? styles.popularAction : ''}`}
                  onClick={() => handleGetStarted(p)}
                  disabled={!!buttonLoading || !p.active}
                  aria-busy={buttonLoading === p.id}
                  aria-disabled={!!buttonLoading || !p.active}
                >
                  {buttonLoading === p.id ? (
                    // you can replace the emoji with a CSS spinner element if you have one
                    <>
                      ⏳ Redirecting...
                    </>
                  ) : (
                    <>🚀 Get Started</>
                  )}
                </button>
                <div className={styles.status}>
                  {p.active ? (
                    <span className={styles.active}>🟢 Currently Available</span>
                  ) : (
                    <span className={styles.inactive}>🔴 Coming Soon</span>
                  )}
                </div>
              </footer>
            </article>
          ))}
        </div>

        <div className={styles.footerNote}>
          <p>💡 All plans include lifetime access and mobile support</p>
        </div>
      </div>
    </div>
  );
}
