// components/TotalRegistered.js
import React, { useEffect, useState, useRef } from "react";
import { FaUserPlus } from "react-icons/fa";
import StatCard from "./StatCard";
import styles from "./TotalRegistered.module.css";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
const ENDPOINT = `${API_BASE}/api/total-registered-verified/`;
const CSRF_ENDPOINT = `${API_BASE}/api/csrf/`; // your csrf path

const fetchCsrfToken = async () => {
  try {
    const res = await fetch(CSRF_ENDPOINT, {
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.csrfToken || data.csrf || data.token || null;
  } catch (err) {
    console.error("Failed to fetch CSRF token", err);
    return null;
  }
};

const TotalRegistered = () => {
  const [totalRegistered, setTotalRegistered] = useState(0);
  const [percentChange, setPercentChange] = useState(null);
  const [trend, setTrend] = useState("none");
  const csrfRef = useRef(null);
  const intervalRef = useRef(null);

  const fetchData = async () => {
    try {
      if (!csrfRef.current) {
        csrfRef.current = await fetchCsrfToken();
      }

      const res = await fetch(ENDPOINT, {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "X-CSRFToken": csrfRef.current || "",
        },
      });

      if (res.status === 401 || res.status === 403) {
        console.warn("Not authenticated for total-registered-verified API");
        return;
      }

      if (!res.ok) {
        console.error("Error fetching total-registered-verified:", res.status);
        return;
      }

      const json = await res.json();
      setTotalRegistered(json.count ?? 0);
      setPercentChange(
        json.percent_change === null || json.percent_change === undefined
          ? null
          : Number(json.percent_change)
      );
      setTrend(json.trend || "none");
    } catch (err) {
      console.error("Failed to fetch total-registered-verified API", err);
    }
  };

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, 30_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const trendClass =
    trend === "up" ? styles.trendPositive : trend === "down" ? styles.trendNegative : styles.trendNeutral;
  const percentText = percentChange === null ? "—" : `${percentChange}%`;

  return (
    <StatCard>
      <div className={styles.container}>
        <div className={styles.iconContainer}>
          <FaUserPlus className={styles.icon} />
        </div>
        <div className={styles.content}>
          <h3 className={styles.label}>Total Registered</h3>
          <div className={styles.value}>{totalRegistered.toLocaleString()}</div>
          <div className={styles.trend}>
            <span className={trendClass}>
              {trend === "up" ? "+" : trend === "down" ? "" : ""}
              {percentText}
            </span>
            <span className={styles.trendText}> from previous 7 days</span>
          </div>
        </div>
      </div>
    </StatCard>
  );
};

export default TotalRegistered;
