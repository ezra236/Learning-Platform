// Plans.jsx
"use client";
import React, { useState, useRef, useEffect } from "react";
import styles from "./ads.module.css";
import { fetchWithCsrf } from "@/lib/fetchCsrf";
import Payment from "./Payment/Payment";
import Done from "./Payment/Done";
import ErrorToast from "./Payment/Error";

const Plans = () => {
  // Data loaded from server: we will flatten groups into a single array, ordered by exam groups
  const [plans, setPlans] = useState([]);
  const [expandedStates, setExpandedStates] = useState([]);
  const extraRefs = useRef([]);
  const [loading, setLoading] = useState(true);
  const [paymentVisible, setPaymentVisible] = useState(false);
  const [doneMsg, setDoneMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    setLoading(true);
    try {
      const res = await fetchWithCsrf("/api/plans/public/", { method: "GET" });
      if (res.status === 401) throw new Error("Not authenticated. Please sign in.");
      if (res.status === 403) throw new Error("Forbidden: not a regular user.");
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Failed to load (${res.status})`);
      }
      const data = await res.json();
      // exam_groups => flatten while preserving order (ATI first, etc.)
      const flattened = [];
      (data.exam_groups || []).forEach((group) => {
        (group.plans || []).forEach((p) => flattened.push({
          ...p,
          exam_display: group.exam_display,
        }));
      });

      setPlans(flattened);
      setExpandedStates(new Array(flattened.length).fill(false));
    } catch (err) {
      setErrorMsg(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  const toggleExpand = (idx) => {
    setExpandedStates((prev) => {
      const copy = prev.slice();
      copy[idx] = !copy[idx];
      return copy;
    });
  };

  // CTA click -> add IntendedPlan and open Payment panel
  async function handlePlanClick(p) {
    try {
      const res = await fetchWithCsrf("/api/intended-plans/", {
        method: "POST",
        body: JSON.stringify({ plan_id: p.id }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(j?.error || j?.detail || `Failed to add (${res.status})`);
      }
      setDoneMsg("Plan added to cart");
      setTimeout(() => setDoneMsg(null), 2500);
      setPaymentVisible(true);
    } catch (err) {
      setErrorMsg(err.message || "Failed to add plan");
      setTimeout(() => setErrorMsg(null), 4000);
    }
  }

  // measure heights for animation
  const measuredHeight = (idx, fallbackPerItem = 28) => {
    return extraRefs.current[idx]?.scrollHeight ?? fallbackPerItem;
  };

  return (
    <section className={styles.adsSection}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>Package Pricing</h2>

        {loading && <div style={{padding: "1rem"}}>Loading plans…</div>}
        {!loading && plans.length === 0 && <div style={{padding: "1rem"}}>No plans available.</div>}

        <div className={styles.plansGrid}>
          {plans.map((plan, index) => {
            const hasExtra = (plan.features || []).length > 4;
            const expanded = expandedStates[index];

            const measured = measuredHeight(index, (plan.features || []).length * 28);

            return (
              <div key={plan.id} className={styles.planCard}>
                <div className={styles.planHeader}>
                  <h3 className={styles.planTitle}>{plan.exam_display}</h3>
                  <p className={styles.planDuration}>{plan.duration_days} Days Access</p>
                  <div className={styles.planPrice}>{plan.currency} {plan.price}</div>
                </div>

                <ul className={styles.featuresList}>
                  {(plan.features || []).slice(0, 4).map((feature, i) => (
                    <li key={i} className={styles.featureItem}>
                      {feature.name ?? feature}
                    </li>
                  ))}

                  {/* expandable extra features */}
                  {hasExtra && (
                    <>
                      <div
                        className={`${styles.extraFeatures} ${expanded ? styles.expanded : ""}`}
                        style={{ maxHeight: expanded ? `${measured}px` : "0px" }}
                        aria-hidden={!expanded}
                      >
                        <div ref={(el) => (extraRefs.current[index] = el)} className={styles.extraFeaturesInner}>
                          {(plan.features || []).slice(4).map((feature, j) => (
                            <li key={j} className={`${styles.featureItem} ${styles.extraFeatureItem}`}>
                              {feature.name ?? feature}
                            </li>
                          ))}
                        </div>
                      </div>

                      <button
                        className={styles.toggleButton}
                        onClick={() => toggleExpand(index)}
                        aria-expanded={expanded}
                        aria-controls={`extra-features-${index}`}
                      >
                        <span className={styles.toggleIcon}>{expanded ? "−" : "+"}</span>
                        <span className={styles.toggleLabel}>
                          {expanded ? "Show less" : `${(plan.features || []).length - 4} more`}
                        </span>
                      </button>
                    </>
                  )}
                </ul>

                <button
                  className={styles.ctaButton}
                  onClick={() => handlePlanClick(plan)}
                >
                  Get Started
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <Payment visible={paymentVisible} onClose={() => setPaymentVisible(false)} onRemoved={() => {
        // refresh list of slips inside Payment automatically; optionally refresh plans if needed
      }} />

      {doneMsg && <Done message={doneMsg} />}
      {errorMsg && <ErrorToast message={errorMsg} />}
    </section>
  );
};

export default Plans;
