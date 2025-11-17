// components/TotalVisitors.js
"use client";

import { useEffect, useRef, useState } from "react";
import { FaUsers } from "react-icons/fa";
import StatCard from "./StatCard";
import styles from "./TotalVisitors.module.css";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
const TOTAL_ENDPOINT = `${API_BASE}/api/total-visitors/`;
const CSRF_ENDPOINT = `${API_BASE}/api/csrf/`; // optional - GET doesn't require CSRF

async function ensureCsrfCookieSet() {
  // Not required for GET, but harmless. Keeps same pattern as other components.
  try {
    await fetch(CSRF_ENDPOINT, { method: "GET", credentials: "include", headers: { Accept: "application/json" } });
  } catch (e) {
    // ignore
  }
}

export default function TotalVisitors() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    total_visits_all_time: 0,
    month_visits: 0,
    prev_month_visits: 0,
    percent_change: 0,
    trend: "same",
  });

  const pollingRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    async function fetchTotal() {
      try {
        await ensureCsrfCookieSet();
        const res = await fetch(TOTAL_ENDPOINT, {
          method: "GET",
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        if (!res.ok) {
          console.warn("total-visitors fetch failed", res.status);
          return;
        }
        const payload = await res.json();
        if (!mounted) return;

        setData({
          total_visits_all_time: payload.total_visits_all_time || 0,
          month_visits: payload.month_visits || 0,
          prev_month_visits: payload.prev_month_visits || 0,
          percent_change: payload.percent_change || 0,
          trend: payload.trend || "same",
        });
        setLoading(false);
      } catch (err) {
        console.warn("fetch total visitors error", err);
      }
    }

    fetchTotal();

    // Poll every 30 minutes (silently)
    pollingRef.current = setInterval(fetchTotal, 30 * 60 * 1000);

    return () => {
      mounted = false;
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const pct = Number(data.percent_change || 0);
  const trendClass = pct > 0 ? styles.trendPositive : pct < 0 ? styles.trendNegative : styles.trendNeutral;
  const formattedTotal = (data.total_visits_all_time || 0).toLocaleString();

  return (
    <StatCard>
      <div className={styles.container}>
        <div className={styles.iconContainer} aria-hidden>
          <FaUsers className={styles.icon} />
        </div>

        <div className={styles.content}>
          <h3 className={styles.label}>Total Visits across all pages</h3>

          <div className={styles.value} aria-live="polite">
            {loading ? "—" : formattedTotal}
          </div>

          <div className={styles.trend}>
            <span className={`${styles.trendBadge} ${trendClass}`} title={`${pct}%`}>
              {pct > 0 ? `+${pct}%` : `${pct}%`}
            </span>
            <span className={styles.trendText}> from last month</span>
          </div>
        </div>
      </div>
    </StatCard>
  );
}
