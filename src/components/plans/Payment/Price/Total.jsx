// Total.jsx
"use client";

import React, { useEffect, useState, useRef } from "react";
import styles from "./Total.module.css";
import { fetchWithCsrf } from "@/lib/fetchCsrf";
import { FaShoppingBag, FaSpinner } from "react-icons/fa";

const POLL_INTERVAL_MS = 2500;

export default function Total({ pollInterval = POLL_INTERVAL_MS }) {
  const [count, setCount] = useState(0);
  const [totals, setTotals] = useState({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const mounted = useRef(false);
  const timerRef = useRef(null);

  async function fetchTotal() {
    try {
      setErr(null);
      const res = await fetchWithCsrf("/api/intended-plans/total/", { method: "GET" });
      if (res.status === 401) {
        setCount(0);
        setTotals({});
        setErr("Not authenticated");
        setLoading(false);
        return;
      }
      if (res.status === 403) {
        setErr("Forbidden");
        setLoading(false);
        return;
      }
      if (!res.ok) {
        const txt = await res.text();
        setErr(txt || `Failed (${res.status})`);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setCount(data.count || 0);
      setTotals(data.totals || {});
      setLoading(false);
    } catch (e) {
      setErr(e.message || String(e));
      setLoading(false);
    }
  }

  useEffect(() => {
    mounted.current = true;
    fetchTotal();

    timerRef.current = setInterval(() => {
      if (!mounted.current) return;
      fetchTotal();
    }, pollInterval);

    return () => {
      mounted.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [pollInterval]);

  const currencyKeys = Object.keys(totals);

  return (
    <div className={styles.container}>
      <div className={styles.inner}>
        <div className={styles.iconWrapper}>
          <FaShoppingBag className={styles.icon} />
        </div>
        
        <div className={styles.content}>
          <div className={styles.title}>Cart Total</div>

          {loading ? (
            <div className={styles.loading}>
              <FaSpinner className={styles.spinner} />
              Calculating...
            </div>
          ) : err ? (
            <div className={styles.error}>{err}</div>
          ) : (
            <>
              <div className={styles.value}>
                {currencyKeys.length === 0 ? (
                  <span className={styles.zero}>No items</span>
                ) : currencyKeys.length === 1 ? (
                  <strong>{currencyKeys[0]} {totals[currencyKeys[0]]}</strong>
                ) : (
                  <div className={styles.multi}>
                    {currencyKeys.map((c) => (
                      <div key={c} className={styles.multiRow}>
                        <span className={styles.currency}>{c}</span>
                        <span className={styles.amount}>{totals[c]}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.count}>
                {count} {count === 1 ? "item" : "items"}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}