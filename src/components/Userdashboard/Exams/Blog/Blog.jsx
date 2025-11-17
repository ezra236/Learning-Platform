// src/components/Blog.jsx
"use client";

import React, { useState, useEffect } from "react";
import styles from "./Blog.module.css";
import Notification from "../../Notification";

export default function Blog() {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [canUseTrial, setCanUseTrial] = useState(false);

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "";

  // utility to read cookie (for CSRF if needed)
  function getCookie(name) {
    if (typeof document === "undefined") return null;
    const cookieString = document.cookie || "";
    const cookies = cookieString.split(";").map((c) => c.trim());
    for (const c of cookies) {
      if (c.startsWith(name + "=")) {
        return decodeURIComponent(c.substring(name.length + 1));
      }
    }
    return null;
  }

  useEffect(() => {
    // on mount, query whether user can use free trial
    let mounted = true;
    async function check() {
      setInitialLoading(true);
      try {
        const url = `${apiBase.replace(/\/$/, "")}/api/can-use-free-trial/`;
        const res = await fetch(url, {
          method: "GET",
          credentials: "include",
          headers: { "Accept": "application/json" },
        });

        if (!res.ok) {
          // treat any error as "deny" but log
          console.error("can-use-free-trial error status:", res.status);
          if (mounted) setCanUseTrial(false);
        } else {
          const data = await res.json();
          if (mounted) setCanUseTrial(Boolean(data.allowed));
        }
      } catch (err) {
        console.error("can-use-free-trial exception:", err);
        if (mounted) setCanUseTrial(false);
      } finally {
        if (mounted) setInitialLoading(false);
      }
    }
    check();
    return () => {
      mounted = false;
    };
  }, [apiBase]);

  // Spinner reused
  const Spinner = ({ size = 18 }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role="img"
      aria-hidden="true"
      style={{ display: "inline-block", verticalAlign: "middle", marginLeft: 8 }}
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.25" />
      <path
        d="M22 12A10 10 0 0 0 12 2"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      >
        <animateTransform
          attributeName="transform"
          attributeType="XML"
          type="rotate"
          from="0 12 12"
          to="360 12 12"
          dur="0.9s"
          repeatCount="indefinite"
        />
      </path>
    </svg>
  );

  // Called when "Start Free Trial" is clicked
  async function handleStartFreeTrial() {
    setError(null);
    setLoading(true);

    try {
      const url = `${apiBase.replace(/\/$/, "")}/api/subscribe-trial/`;
      const csrftoken = getCookie("csrftoken");

      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(csrftoken ? { "X-CSRFToken": csrftoken } : {}),
        },
        body: JSON.stringify({}),
      });

      if (res.status === 201 || res.ok) {
        // success: reload the page (full refresh)
        if (typeof window !== "undefined") {
          window.location.reload();
          return;
        }
      }

      // If trial already used (409), show message and hide button
      if (res.status === 409) {
        setError("Free trial already used for this account/email.");
        setCanUseTrial(false);
        setLoading(false);
        return;
      }

      if (res.status === 401 || res.status === 403) {
        setError("Authentication required. Please sign in and try again.");
        setLoading(false);
        return;
      }

      let data;
      try {
        data = await res.json();
      } catch (e) {
        data = null;
      }
      const serverMessage = data && (data.detail || data.error || JSON.stringify(data));
      setError(serverMessage || `Subscription API returned status ${res.status}`);
      setLoading(false);
    } catch (err) {
      console.error("subscribe-trial exception:", err);
      setError("Network error while subscribing for trial. Make sure the API is reachable.");
      setLoading(false);
    }
  }

  // The rest of the component (unchanged layout) but Start Free Trial button is conditional
  const planItems = [
    {
      icon: "🧪",
      title: "ATI TEAS Prep",
      description:
        "Complete preparation for the ATI TEAS exam with practice tests, study guides, and personalized learning paths.",
      color: "#4f46e5",
      features: [
        "500+ Practice Questions",
        "Full-Length Mock Exams",
        "Detailed Explanations",
        "Progress Tracking",
      ],
    },
    {
      icon: "❤️",
      title: "HESI A2 Prep",
      description:
        "Comprehensive HESI A2 preparation covering all sections including Math, Reading, Vocabulary and Anatomy.",
      color: "#10b981",
      features: [
        "All Subject Coverage",
        "Adaptive Learning",
        "Performance Analytics",
        "Mobile Access",
      ],
    },
    {
      icon: "👩‍⚕️",
      title: "NCLEX Prep",
      description:
        "Proven NCLEX-RN and NCLEX-PN preparation with thousands of practice questions and simulated exams.",
      color: "#f59e0b",
      features: ["CAT Simulator", "Question Bank 2000+", "Content Review", "Pass Guarantee"],
    },
    {
      icon: "📚",
      title: "Nursing Testbanks",
      description:
        "Extensive collection of nursing course testbanks to help you succeed in your nursing program.",
      color: "#ef4444",
      features: ["Multiple Specialties", "Instant Access", "Updated Content", "Faculty Approved"],
    },
  ];

  // navigate to plans used by card Get Started (unchanged)
  function navigateToPlans() {
    try {
      // SPA-friendly navigation if using next/navigation router
      if (typeof window !== "undefined") {
        window.location.href = "/user/plans";
      }
    } catch (e) {
      if (typeof window !== "undefined") {
        window.location.href = "/user/plans";
      }
    }
  }

  return (
    <div className={styles.container}>
      {/* show Notification if free trial not available */}
      {!initialLoading && !canUseTrial && (
        <Notification
          title="Free Trial Unavailable"
          message="You have already used a free trial — no free plans available."
        />
      )}

      {/* Accessibility live region */}
      <div
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0,0,0,0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        {loading ? "Processing trial subscription…" : ""}
      </div>

      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.badge}>
            <span className={styles.unicodeIcon}>⭐</span>
            Premium Learning Platform
          </div>
          <h1 className={styles.title}>Welcome to RushHourCamp</h1>
          <p className={styles.lead}>
            Your gateway to exam success. Explore our resources and discover how to
            transform your preparation journey.
          </p>

          <div className={styles.ctaSection}>
            {/* Conditionally render Start Free Trial button only when allowed */}
            {initialLoading ? (
              <button type="button" className={styles.primaryCta} disabled>
                Checking…
              </button>
            ) : (
              canUseTrial && (
                <button
                  type="button"
                  className={styles.primaryCta}
                  onClick={handleStartFreeTrial}
                  disabled={loading}
                  aria-disabled={loading}
                  title={loading ? "Processing trial…" : "Start Free Trial"}
                >
                  <span className={styles.unicodeIcon}>🚀</span>
                  {loading ? "Starting…" : "Start Free Trial"}
                  {loading && <Spinner />}
                </button>
              )
            )}

            <button
              type="button"
              className={styles.secondaryCta}
              disabled={loading}
              aria-disabled={loading}
            >
              <span className={styles.unicodeIcon}>▶️</span>
              Watch Demo
            </button>
          </div>

          {error && (
            <div role="alert" style={{ color: "var(--danger, #c0392b)", marginTop: 12 }}>
              {error}
            </div>
          )}

          <div className={styles.scrollIndicator}>
            <span className={styles.unicodeIcon}>⬇️</span>
          </div>
        </div>

        <div className={styles.heroVisual}>
          <div className={styles.floatingElement} style={{ animationDelay: "0s" }}>
            <span className={styles.unicodeIcon}>📖</span>
          </div>
          <div className={styles.floatingElement} style={{ animationDelay: "2s" }}>
            <span className={styles.unicodeIcon}>🎯</span>
          </div>
          <div className={styles.floatingElement} style={{ animationDelay: "4s" }}>
            <span className={styles.unicodeIcon}>💡</span>
          </div>
        </div>
      </section>

      {/* The rest of the component (cards & stats) remains unchanged */}
      <section className={styles.featuredSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Our Premium Study Plans</h2>
          <p className={styles.sectionSubtitle}>
            Choose the perfect plan for your exam preparation and boost your confidence
          </p>
        </div>

        <div className={styles.cards}>
          {planItems.map((plan, index) => (
            <article
              key={plan.title + index}
              className={styles.card}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div
                className={styles.cardIcon}
                style={{ backgroundColor: `${plan.color}15`, color: plan.color }}
                aria-hidden
              >
                <span className={styles.unicodeIcon}>{plan.icon}</span>
              </div>

              <div className={styles.cardContent}>
                <h3 className={styles.cardTitle}>{plan.title}</h3>
                <p className={styles.cardDescription}>{plan.description}</p>

                <div className={styles.featuresList}>
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className={styles.featureItem}>
                      <span
                        className={styles.checkIcon}
                        style={{ color: plan.color }}
                        aria-hidden
                      >
                        ✓
                      </span>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <div className={styles.cardMeta}>
                  <button
                    type="button"
                    className={styles.getStartedBtn}
                    style={{ backgroundColor: plan.color }}
                    onClick={navigateToPlans}
                    disabled={loading}
                    aria-disabled={loading}
                    title={loading ? "Navigating…" : "Get Started"}
                  >
                    {loading ? "Navigating…" : "Get Started"}
                    <span className={styles.unicodeIcon}>→</span>
                    {loading && <Spinner />}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.statsSection}>
        <div className={styles.statsContainer}>
          <div className={styles.statItem}>
            <div className={styles.statIcon}>
              <span className={styles.unicodeIcon}>🏆</span>
            </div>
            <div className={styles.statNumber}>95%</div>
            <div className={styles.statLabel}>Success Rate</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statIcon}>
              <span className={styles.unicodeIcon}>👥</span>
            </div>
            <div className={styles.statNumber}>10k+</div>
            <div className={styles.statLabel}>Students Helped</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statIcon}>
              <span className={styles.unicodeIcon}>🎧</span>
            </div>
            <div className={styles.statNumber}>24/7</div>
            <div className={styles.statLabel}>Support Available</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statIcon}>
              <span className={styles.unicodeIcon}>📝</span>
            </div>
            <div className={styles.statNumber}>500+</div>
            <div className={styles.statLabel}>Practice Exams</div>
          </div>
        </div>
      </section>
    </div>
  );
}
