// components/ATITeas.js
"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBookMedical, faUsers, faCheckCircle, faUpload } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useRef, useState } from "react";
import styles from "./ATITeas.module.css";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
const STATS_ENDPOINT = `${API_BASE}/api/ati-teas-stats/`;
const CSRF_ENDPOINT = `${API_BASE}/api/csrf/`; // ensures csrftoken cookie is set

async function ensureCsrfCookieSet() {
  try {
    await fetch(CSRF_ENDPOINT, { method: "GET", credentials: "include", headers: { Accept: "application/json" } });
  } catch (err) {
    // ignore
  }
}

export default function ATITeas() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    subscribers: null,
    exams_completed: null,
    questions_uploaded: null,
  });

  const pollingRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    async function fetchStats() {
      try {
        await ensureCsrfCookieSet();
        const res = await fetch(STATS_ENDPOINT, {
          method: "GET",
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        if (!res.ok) {
          console.warn("ati-teas-stats fetch failed", res.status);
          return;
        }
        const payload = await res.json();
        if (!mounted) return;

        setStats({
          subscribers: payload.subscribers || null,
          exams_completed: payload.exams_completed || null,
          questions_uploaded: payload.questions_uploaded || null,
        });
        setLoading(false);
      } catch (err) {
        console.warn("fetch ati teas stats error", err);
      }
    }

    fetchStats();
    pollingRef.current = setInterval(fetchStats, 30 * 60 * 1000); // 30 minutes

    return () => {
      mounted = false;
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  function renderStatBlock(icon, label, info) {
    if (!info) {
      return (
        <div className={styles.statItem}>
          <div className={styles.statHeader}>
            <FontAwesomeIcon icon={icon} className={styles.statIcon} />
            <span className={styles.statLabel}>{label}</span>
          </div>
          <div className={styles.statValue}>—</div>
          <div className={styles.statGrowth}><span className={styles.neutral}>—</span></div>
        </div>
      );
    }

    const pct = Number(info.percent_change || 0);
    const trendClass = pct > 0 ? styles.positive : pct < 0 ? styles.negative : styles.neutral;
    // Format display: + or -
    const pctText = pct > 0 ? `+${pct}%` : `${pct}%`;

    // show main number as the current-month count (for subscribers / exams / questions),
    // fall back to total_all_time if month count missing.
    const mainNumber = (typeof info.month !== "undefined" ? info.month : info.total_all_time) || 0;

    return (
      <div className={styles.statItem}>
        <div className={styles.statHeader}>
          <FontAwesomeIcon icon={icon} className={styles.statIcon} />
          <span className={styles.statLabel}>{label}</span>
        </div>
        <div className={styles.statValue}>{mainNumber.toLocaleString()}</div>
        <div className={styles.statGrowth}>
          <span className={`${styles.badge} ${trendClass}`}>{pctText}</span>
          <span className={styles.growthText}> from last month</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <FontAwesomeIcon icon={faBookMedical} className={styles.icon} />
        <h2 className={styles.title}>ATI TEAS</h2>
      </div>

      <div className={styles.stats}>
        {renderStatBlock(faUsers, "Registered / Subscribed Users", loading ? null : stats.subscribers)}
        {renderStatBlock(faCheckCircle, "Exams Completed", loading ? null : stats.exams_completed)}
        {renderStatBlock(faUpload, "Questions Uploaded", loading ? null : stats.questions_uploaded)}
      </div>
    </div>
  );
}
