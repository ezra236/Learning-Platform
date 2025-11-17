// SubscriptionsStat.jsx
import React, { useEffect, useState, useRef } from "react";
import styles from "./SubscriptionsStat.module.css";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

async function fetchCsrfToken() {
  const res = await fetch(`${API_BASE}/api/csrf/`, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch CSRF token");
  const data = await res.json();
  return data.csrfToken;
}

async function fetchSubscriptionsOverview(csrfToken) {
  const res = await fetch(`${API_BASE}/api/admin/subscriptions-overview/`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrfToken || "",
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Subscriptions overview fetch failed: ${res.status} ${text}`);
  }
  return res.json();
}

function fmtNumber(n) {
  if (n === null || n === undefined) return "—";
  if (typeof n === "number") return n.toLocaleString();
  // if numeric string
  return String(n);
}

function fmtCurrency(n) {
  if (n === null || n === undefined) return "—";
  // show as USD with thousands separators and 1 decimal if needed
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export default function SubscriptionsStat() {
  const [state, setState] = useState({
    totalActive: null,
    monthlyCount: null,
    monthlyRevenue: null,
    yearlyRevenue: null,
    subscriptionRate: null, // percent number, e.g. 78.12
    subscriptionsPercentChange: null, // float or null
    revenuePercentChange: null, // float or null
  });

  const intervalRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function loadOnce() {
      try {
        const csrf = await fetchCsrfToken();
        const payload = await fetchSubscriptionsOverview(csrf);
        if (cancelled) return;

        setState({
          totalActive: payload.total_active_subscriptions,
          monthlyCount: payload.current_month?.subscriptions_count ?? null,
          monthlyRevenue: payload.current_month?.revenue ?? null,
          yearlyRevenue: payload.current_year?.revenue ?? null,
          subscriptionRate: payload.subscription_rate_percent ?? null,
          subscriptionsPercentChange: payload.percent_changes?.subscriptions_count_percent_change ?? null,
          revenuePercentChange: payload.percent_changes?.revenue_percent_change ?? null,
        });
      } catch (err) {
        // Silent failure (user is not to know); dev console only
        if (process.env.NODE_ENV === "development") {
          console.warn("SubscriptionsStat fetch failed:", err);
        }
      }
    }

    loadOnce();
    intervalRef.current = setInterval(loadOnce, 300_000); // 5 minutes

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Subscription rate label
  const rateLabel =
    state.subscriptionRate === null ? "—" : `${state.subscriptionRate.toFixed(2)}%`;

  // percent change helper
  const pctLabel = (v) => {
    if (v === null) return "New";
    if (typeof v === "number") {
      const sign = v > 0 ? "+" : v < 0 ? "" : "";
      return `${sign}${v}%`;
    }
    return "—";
  };

  return (
    <a href="/admin/subscriptions/" className={styles.container}>
      <div className={styles.backgroundEffect}></div>
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.iconContainer}>
            <span className={styles.icon}>💰</span>
          </div>
          <div className={styles.headerText}>
            <h3 className={styles.title}>Subscriptions</h3>
            <p className={styles.subtitle}>Active plans & revenue</p>
          </div>
        </div>

        <div className={styles.stats}>
          <div className={styles.mainValue}>{fmtNumber(state.totalActive)}</div>
          <div className={styles.valueLabel}>Active Plans</div>
        </div>

        <div className={styles.progressSection}>
          <div className={styles.progressHeader}>
            <span className={styles.progressLabel}>Subscription Rate</span>
            <span className={styles.progressValue}>{rateLabel}</span>
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: state.subscriptionRate ? `${Math.max(0, Math.min(100, state.subscriptionRate))}%` : "0%" }}
            ></div>
          </div>
          <div className={styles.progressTrend}>
            <span className={styles.trendIcon}>{state.subscriptionsPercentChange === null ? "★" : state.subscriptionsPercentChange > 0 ? "↗" : "↘"}</span>
            <span className={styles.trendText}>
              {pctLabel(state.subscriptionsPercentChange)} from last month
            </span>
          </div>
        </div>

        <div className={styles.revenueSection}>
          <div className={styles.revenueItem}>
            <span className={styles.revenueLabel}>Monthly</span>
            <span className={styles.revenueValue}>{fmtCurrency(state.monthlyRevenue ?? 0)}</span>
          </div>
          <div className={styles.revenueItem}>
            <span className={styles.revenueLabel}>Annual</span>
            <span className={styles.revenueValue}>{fmtCurrency(state.yearlyRevenue ?? 0)}</span>
          </div>
        </div>

        <div className={styles.revenueDelta}>
          <small>Revenue change: {pctLabel(state.revenuePercentChange)} vs last month</small>
        </div>
      </div>

      <div className={styles.footer}>
        <span className={styles.cta}>
          View Detailed Analytics
          <span className={styles.ctaArrow}>→</span>
        </span>
      </div>
    </a>
  );
}
