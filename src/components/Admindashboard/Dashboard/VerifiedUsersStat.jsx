// VerifiedUsersStat.jsx
import React, { useEffect, useState, useRef } from "react";
import styles from './VerifiedUsersStat.module.css';

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

async function fetchVerifiedOverview(csrfToken) {
  const res = await fetch(`${API_BASE}/api/admin/verified-users-overview/`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrfToken || "",
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Fetch failed: ${res.status} ${text}`);
  }
  return res.json();
}

function formatNumber(n) {
  if (n === null || n === undefined) return "—";
  return Number(n).toLocaleString();
}

export default function VerifiedUsersStat() {
  const [state, setState] = useState({
    totalVerified: null,
    verificationRate: null,
    monthlyTrendLabel: "—",
    pendingCount: null,
    successRate: null,
    nonVerifiedRate: null,
    avgTimeDisplay: "—",
  });

  const intervalRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function loadOnce() {
      try {
        const csrf = await fetchCsrfToken();
        const payload = await fetchVerifiedOverview(csrf);

        if (cancelled) return;

        const totalVerified = payload?.total_verified_count ?? null;
        const verificationRate = payload?.verification_rate_percent ?? null;
        const pendingCount = payload?.pending_count ?? null;
        const successRate = payload?.success_rate_percent ?? null;
        const nonVerifiedRate = payload?.non_verified_rate_percent ?? null;
        const avgTime = payload?.average_time_display ?? null;

        // monthly trend label formatted: "+3%" or "New" if null or "0.0%" if 0
        const trendRaw = payload?.monthly_trend?.percent_change;
        let monthlyTrendLabel = "🎉";
        if (trendRaw === null) {
          monthlyTrendLabel = "🎉";
        } else if (typeof trendRaw === "number") {
          const sign = trendRaw > 0 ? "+" : "";
          monthlyTrendLabel = `${sign}${trendRaw}%`;
        }

        setState({
          totalVerified,
          verificationRate,
          monthlyTrendLabel,
          pendingCount,
          successRate,
          nonVerifiedRate,
          avgTimeDisplay: avgTime ?? "—",
        });
      } catch (err) {
        // silent failure per your requirements; dev console only
        if (process.env.NODE_ENV === "development") {
          console.warn("VerifiedUsersStat fetch failed:", err);
        }
      }
    }

    // initial load
    loadOnce();

    // poll every 5 minutes
    intervalRef.current = setInterval(loadOnce, 300_000);

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Prepare display values (preserve structure — only replace text)
  const totalVerifiedDisplay = state.totalVerified !== null ? formatNumber(state.totalVerified) : "—";
  const verificationRateDisplay = state.verificationRate !== null ? `${state.verificationRate}%` : "—";
  const pendingDisplay = state.pendingCount !== null ? formatNumber(state.pendingCount) : "—";
  const successRateDisplay = state.successRate !== null ? `${state.successRate}%` : "—";
  const nonVerifiedRateDisplay = state.nonVerifiedRate !== null ? `${state.nonVerifiedRate}%` : "—";
  const avgTimeDisplay = state.avgTimeDisplay ?? "—";
  const circlePercentageStyle = { '--percentage': state.verificationRate !== null ? `${state.verificationRate}%` : "0%" };

  return (
    <div className={styles.container}>
      <div className={styles.backgroundGradient}></div>
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.iconContainer}>
            <span className={styles.icon}>✅</span>
          </div>
          <div className={styles.headerText}>
            <h3 className={styles.title}>Verified Users</h3>
            <p className={styles.subtitle}>Identity verification status</p>
          </div>
        </div>
        
        <div className={styles.mainStats}>
          <div className={styles.primaryValue}>{totalVerifiedDisplay}</div>
          <div className={styles.valueLabel}>Total Verified</div>
        </div>

        <div className={styles.verificationSection}>
          <div className={styles.percentageCircle}>
            <div className={styles.circleBackground}></div>
            <div className={styles.circleFill} style={circlePercentageStyle}></div>
            <div className={styles.circleText}>
              <span className={styles.percentage}>{verificationRateDisplay}</span>
              <span className={styles.percentageLabel}>Rate</span>
            </div>
          </div>
          
          <div className={styles.verificationInfo}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Monthly Trend</span>
              <span className={styles.trend}>
                <span className={styles.trendIcon}>↗</span>
                {state.monthlyTrendLabel}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.detailedStats}>
          <div className={styles.statRow}>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>{pendingDisplay}</span>
              <span className={styles.statLabel}>Pending</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>{successRateDisplay}</span>
              <span className={styles.statLabel}>Success Rate</span>
            </div>
          </div>
          <div className={styles.statRow}>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>{nonVerifiedRateDisplay}</span>
              <span className={styles.statLabel}>Non-verified rate</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>{avgTimeDisplay}</span>
              <span className={styles.statLabel}>Avg. Time</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
