// components/TodayPayments.js
import React, { useEffect, useRef, useState } from "react";
import { FaMoneyCheckAlt, FaDollarSign } from "react-icons/fa";
import StatCard from "./StatCard";
import styles from "./TodayPayments.module.css";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
const ENDPOINT = `${API_BASE}/api/today-payments/`;
const CSRF_ENDPOINT = `${API_BASE}/api/csrf/`;

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

const TodayPayments = () => {
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0.0);
  const [amountPercentChange, setAmountPercentChange] = useState(null);
  const [amountTrend, setAmountTrend] = useState("none");
  const [txnPercentChange, setTxnPercentChange] = useState(null);
  const [txnTrend, setTxnTrend] = useState("none");

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
        console.warn("Not authenticated for today-payments API");
        return;
      }

      if (!res.ok) {
        console.error("Error fetching today-payments:", res.status);
        return;
      }

      const json = await res.json();

      setTotalTransactions(json.count ?? 0);
      setTotalAmount(json.amount ?? 0.0);

      setAmountPercentChange(
        json.amount_percent_change === null || json.amount_percent_change === undefined
          ? null
          : Number(json.amount_percent_change)
      );
      setAmountTrend(json.amount_trend || "none");

      setTxnPercentChange(
        json.count_percent_change === null || json.count_percent_change === undefined
          ? null
          : Number(json.count_percent_change)
      );
      setTxnTrend(json.count_trend || "none");
    } catch (err) {
      console.error("Failed to fetch today-payments API", err);
    }
  };

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, 30_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // choose styling class based on trend (you can reuse styles from TodaySignedIn)
  const trendClass =
    amountTrend === "up" ? styles.trendPositive : amountTrend === "down" ? styles.trendNegative : styles.trendNeutral;
  const percentText = amountPercentChange === null ? "—" : `${amountPercentChange}%`;

  return (
    <StatCard>
      <div className={styles.header}>
        <div className={styles.titleContainer}>
          <div className={styles.iconContainer}>
            <FaMoneyCheckAlt className={styles.icon} />
          </div>
          <h3 className={styles.title}>Today's Payments</h3>
        </div>
      </div>

      <div className={styles.paymentStats}>
        <div className={styles.paymentItem}>
          <div className={styles.paymentInfo}>
            <FaDollarSign className={styles.paymentIcon} />
            <span className={styles.paymentLabel}>Total Transactions</span>
          </div>
          <div className={styles.paymentValue}>{totalTransactions.toLocaleString()}</div>
        </div>

        <div className={styles.paymentItem}>
          <div className={styles.paymentInfo}>
            <FaMoneyCheckAlt className={styles.paymentIcon} />
            <span className={styles.paymentLabel}>Total Amount</span>
          </div>
          <div className={styles.paymentValue}>
            {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      <div className={styles.trend}>
        <span className={trendClass}>
          {amountTrend === "up" ? "+" : amountTrend === "down" ? "" : ""}
          {percentText}
        </span>
        <span className={styles.trendText}> from yesterday (amount)</span>
      </div>
    </StatCard>
  );
};

export default TodayPayments;
