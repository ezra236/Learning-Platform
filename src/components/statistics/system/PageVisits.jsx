// components/PageVisits.js
"use client";

import { useEffect, useRef, useState } from "react";
import { FaEye, FaChevronDown, FaChevronUp } from "react-icons/fa";
import StatCard from "./StatCard";
import styles from "./PageVisits.module.css";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
const VISIT_ENDPOINT = `${API_BASE}/api/page-visits/`;
const CSRF_ENDPOINT = `${API_BASE}/api/csrf/`;

// Minimum UI pages to show when collapsed
const DEFAULT_VISIBLE = 3;

function ensureCsrfCookieSet() {
  // Hit the csrf endpoint so the server sets csrftoken cookie (non-blocking)
  return fetch(CSRF_ENDPOINT, { method: "GET", credentials: "include", headers: { Accept: "application/json" } })
    .catch(() => null);
}

export default function PageVisits() {
  const [expanded, setExpanded] = useState(false);
  const [pagesData, setPagesData] = useState([]); // array from API
  const pollingRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    async function fetchVisits() {
      try {
        // ensure CSRF cookie set (harmless for GET)
        await ensureCsrfCookieSet();

        const res = await fetch(VISIT_ENDPOINT, {
          method: "GET",
          credentials: "include",
          headers: { Accept: "application/json" },
        });

        if (!res.ok) {
          console.warn("page-visits fetch failed", res.status);
          return;
        }

        const payload = await res.json();
        if (!mounted) return;

        // payload.pages should be [{page, today_visits, yesterday_visits, percent_change, trend}, ...]
        setPagesData(payload.pages || []);
      } catch (err) {
        console.warn("fetch page visits error", err);
      }
    }

    fetchVisits();

    // Poll every 30 minutes (1800_000 ms)
    pollingRef.current = setInterval(fetchVisits, 30 * 60 * 1000);

    return () => {
      mounted = false;
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const displayedPages = expanded ? pagesData : pagesData.slice(0, DEFAULT_VISIBLE);

  return (
    <StatCard className={expanded ? styles.expanded : ""}>
      <div className={styles.header}>
        <div className={styles.titleContainer}>
          <div className={styles.iconContainer}>
            <FaEye className={styles.icon} />
          </div>
          <h3 className={styles.title}>Page Visits</h3>
        </div>
      </div>

      <div className={styles.visitsList}>
        {displayedPages.map((p) => {
          // percent_change returned by API (float, positive = increase, negative = decrease)
          const pct = Number(p.percent_change || 0);
          const trend = p.trend || (pct > 0 ? "increase" : pct < 0 ? "decrease" : "same");

          // Map percent_change magnitude to width for the bar. Cap at 200%
          const widthPercent = Math.min(Math.abs(pct), 200);

          // Choose color: blue for increase, red for decrease, gray for same
          const barColor = trend === "increase" ? undefined /* let css default blue via class */ : trend === "decrease" ? undefined /* let css default red via class */ : undefined;

          return (
            <div key={p.page} className={styles.visitItem}>
              <span className={styles.pageName}>{p.page}</span>
              <div className={styles.visitInfo}>
                <div className={styles.countAndBadge}>
                  <span className={styles.visitCount}>{(p.today_visits || 0).toLocaleString()}</span>
                  <span
                    className={`${styles.changeBadge} ${
                      trend === "increase" ? styles.increase : trend === "decrease" ? styles.decrease : styles.same
                    }`}
                  >
                    {pct > 0 ? `+${pct}%` : `${pct}%`}
                  </span>
                </div>

                <div className={styles.visitBar}>
                  <div
                    className={`${styles.visitBarFill} ${trend === "increase" ? styles.fillIncrease : trend === "decrease" ? styles.fillDecrease : styles.fillSame}`}
                    style={{
                      width: `${widthPercent}%`,
                    }}
                    title={`${pct}% from yesterday`}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {pagesData.length > DEFAULT_VISIBLE && (
        <button className={styles.viewMoreBtn} onClick={() => setExpanded((s) => !s)}>
          {expanded ? (
            <>
              <span>Show Less</span>
              <FaChevronUp className={styles.chevron} />
            </>
          ) : (
            <>
              <span>View More</span>
              <FaChevronDown className={styles.chevron} />
            </>
          )}
        </button>
      )}
    </StatCard>
  );
}
