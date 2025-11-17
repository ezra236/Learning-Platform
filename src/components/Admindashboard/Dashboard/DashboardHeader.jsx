// DashboardHeader.jsx (replace or import into your existing component)
import React, { useEffect, useState, useRef } from "react";
import styles from "./DashboardHeader.module.css";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

async function fetchCsrfToken() {
  const res = await fetch(`${API_BASE}/api/csrf/`, {
    method: "GET",
    credentials: "include", // ensure cookies (sessionid) are included
  });
  if (!res.ok) throw new Error("CSRF fetch failed");
  const data = await res.json();
  return data.csrfToken;
}

async function fetchStats(csrfToken) {
  const res = await fetch(`${API_BASE}/api/admin/stats/`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      // GET typically doesn't require CSRF token, but send it for safety
      "X-CSRFToken": csrfToken || "",
    },
  });
  if (!res.ok) {
    // do not notify the user (silent). Still throw so callers can decide.
    throw new Error(`Stats fetch failed: ${res.status}`);
  }
  return res.json();
}

export default function DashboardHeader() {
  const [stats, setStats] = useState({
    users: "—",
    assistants: "—",
    active_percent: "—",
  });

  // keep the interval id
  const intervalRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function loadOnce() {
      try {
        const csrfToken = await fetchCsrfToken();
        const data = await fetchStats(csrfToken);

        if (!cancelled) {
          // normalize numbers for display, e.g. 12800 -> "12.8k"
          const formatCount = (n) => {
            if (typeof n !== "number") return n;
            if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
            return `${n}`;
          };

          setStats({
            users: formatCount(data.users),
            assistants: data.assistants,
            active_percent: data.active_percent,
          });
        }
      } catch (err) {
        // silent failure: do nothing (per requirement "user is not to know about this")
        // but keep console for debug in dev
        if (process.env.NODE_ENV === "development") {
          console.warn("Failed to fetch dashboard stats:", err);
        }
      }
    }

    // initial load
    loadOnce();

    // set interval: every 5 minutes (300000ms)
    intervalRef.current = setInterval(() => {
      loadOnce();
    }, 300_000);

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className={styles.dashboardHeader}>
      <div className={styles.headerBackground}></div>
      <div className={styles.headerContent}>
        <div className={styles.textContent}>
          <h1 className={styles.title}>
            <span className={styles.titleIcon}>🎯</span>
            Admin Dashboard
          </h1>
          <p className={styles.description}>
            Welcome to your command center! Manage exams, users, and platform analytics with ease.
            Everything you need to oversee the platform is right here.
          </p>
          <div className={styles.statsPreview}>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>{stats.users}</span>
              <span className={styles.statLabel}>Users</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>{stats.assistants}</span>
              <span className={styles.statLabel}>Assistants</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>{stats.active_percent}</span>
              <span className={styles.statLabel}>Active</span>
            </div>
          </div>
        </div>
        <div className={styles.visualContent}>
          <div className={styles.floatingIcons}>
            <span className={styles.icon}>📊</span>
            <span className={styles.icon}>👥</span>
            <span className={styles.icon}>🎓</span>
            <span className={styles.icon}>⚡</span>
          </div>
        </div>
      </div>
    </div>
  );
}
