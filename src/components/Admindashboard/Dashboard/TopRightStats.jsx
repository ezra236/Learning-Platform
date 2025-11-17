// TopRightStats.jsx
import React, { useEffect, useState, useRef } from "react";
import styles from "./TopRightStats.module.css";

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

async function fetchMonthlyActivity(csrfToken) {
  const res = await fetch(`${API_BASE}/api/admin/monthly-activity/`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrfToken || "",
    },
  });
  if (!res.ok) {
    // Could be 403 if not superadmin — treat as silent failure
    const text = await res.text().catch(() => "");
    throw new Error(`Monthly activity fetch failed: ${res.status} ${text}`);
  }
  return res.json();
}

function formatNumber(n) {
  if (n === null || n === undefined) return "—";
  return Number(n).toLocaleString();
}

export default function TopRightStats() {
  const [data, setData] = useState({
    usersCount: null,
    assistantsCount: null,
    usersChange: null,         // number | null
    assistantsChange: null,    // number | null
  });

  const intervalRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function loadOnce() {
      try {
        const csrfToken = await fetchCsrfToken();
        const payload = await fetchMonthlyActivity(csrfToken);

        if (cancelled) return;

        // payload shape (per backend): { regular: { current_month_count, previous_month_count, percent_change }, assistants: { ... } }
        const usersCount = payload?.regular?.current_month_count ?? null;
        const usersChange = payload?.regular?.percent_change ?? null;
        const assistantsCount = payload?.assistants?.current_month_count ?? null;
        const assistantsChange = payload?.assistants?.percent_change ?? null;

        setData({
          usersCount,
          assistantsCount,
          usersChange,
          assistantsChange,
        });
      } catch (err) {
        // Silent failure — do not alert the user.
        if (process.env.NODE_ENV === "development") {
          console.warn("TopRightStats: failed to fetch monthly activity:", err);
        }
      }
    }

    // initial
    loadOnce();

    // poll every 5 minutes (300000 ms)
    intervalRef.current = setInterval(() => {
      loadOnce();
    }, 300_000);

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Helper to prepare the UI values
  const prepareStat = (count, change) => {
    // value shown as formatted count (e.g., 12,847)
    const value = count !== null ? formatNumber(count) : "—";

    // trend text:
    // - if change === null => "New"
    // - else "+12%" or "-3%"
    let trend = "—";
    let trendDirection = "up"; // default class (you already have 'up'/'down' style hooks)
    if (change === null) {
      trend = "New";
      trendDirection = "up";
    } else if (typeof change === "number") {
      const sign = change > 0 ? "+" : change < 0 ? "" : "";
      trend = `${sign}${change}%`;
      trendDirection = change < 0 ? "down" : "up";
    }

    return { value, trend, trendDirection };
  };

  const usersStat = prepareStat(data.usersCount, data.usersChange);
  const asstStat = prepareStat(data.assistantsCount, data.assistantsChange);

  const stats = [
    {
      icon: "👥",
      title: "Users",
      value: usersStat.value,
      trend: usersStat.trend,
      trendDirection: usersStat.trendDirection,
      description: "Active regular users this month (logged in at least once)",
      context: "Rushhourcamp",
      color: "#667eea",
    },
    {
      icon: "🤖",
      title: "Assistants",
      value: asstStat.value,
      trend: asstStat.trend,
      trendDirection: asstStat.trendDirection,
      description: "Active assistants this month (logged in at least once)",
      context: "Rushhourcamp",
      color: "#764ba2",
    },
  ];

  return (
    <div className={styles.statsContainer}>
      {stats.map((stat, index) => (
        <div
          key={index}
          className={styles.statCard}
          style={{ ["--accent-color"]: stat.color }} // CSS var used by your stylesheet
        >
          <div className={styles.cardBackground}></div>
          <div className={styles.statHeader}>
            <div className={styles.iconContainer}>
              <span className={styles.statIcon}>{stat.icon}</span>
            </div>
            <h3 className={styles.statTitle}>{stat.title}</h3>
          </div>

          <div className={styles.statValue}>{stat.value}</div>

          <div className={`${styles.statTrend} ${styles[stat.trendDirection]}`}>
            <span className={styles.trendIcon}>
              {stat.trendDirection === "up" ? "↗" : "↘"}
            </span>
            {stat.trend === "New" ? `${stat.trend}` : `${stat.trend} this month`}
          </div>

          <div className={styles.statDescription}>
            <p className={styles.descriptionText}>{stat.description}</p>
            <p className={styles.contextText}>{stat.context}</p>
          </div>

          <div className={styles.cardGlow}></div>
        </div>
      ))}
    </div>
  );
}
