// Paypal.jsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import styles from "./paypal.module.css";
import { fetchWithCsrf, ensureCsrf } from "@/lib/fetchCsrf";
import Paymentdone from "./Paymentdone";
import ErrorToast from "../Error";
import { FaPaypal, FaLock, FaSpinner } from "react-icons/fa";

const API_PREFIX = "/api";

export default function Paypal() {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [currency, setCurrency] = useState(process.env.NEXT_PUBLIC_PAYPAL_CURRENCY || "USD");
  const [amount, setAmount] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [showDone, setShowDone] = useState(false);
  const [err, setErr] = useState(null);

  async function loadTotal() {
    try {
      const res = await fetchWithCsrf("/api/intended-plans/total/", { method: "GET" });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Failed (${res.status})`);
      }
      const data = await res.json();
      const keys = Object.keys(data.totals || {});
      if (keys.length === 0) {
        setAmount(null);
      } else {
        const cur = keys[0];
        setCurrency(cur);
        setAmount(data.totals[cur]);
      }
    } catch (e) {
      setErr(e.message || String(e));
    }
  }

  useEffect(() => {
    loadTotal();
  }, []);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    if (!clientId) {
      setErr("PayPal client ID not configured in frontend env.");
      return;
    }
    const existing = document.getElementById("paypal-sdk");
    if (existing) return;

    const s = document.createElement("script");
    s.id = "paypal-sdk";
    s.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}`;
    s.async = true;
    s.onload = () => {};
    s.onerror = () => setErr("Failed to load PayPal SDK");
    document.body.appendChild(s);
  }, [currency]);

  useEffect(() => {
    if (!window.paypal || !containerRef.current) return;
    if (containerRef.current.childElementCount > 0) return;

    window.paypal.Buttons({
      style: { 
        layout: "vertical", 
        color: "blue", 
        shape: "pill", 
        label: "checkout",
        height: 45,
        tagline: false
      },

      createOrder: async (data, actions) => {
        try {
          setLoading(true);
          await ensureCsrf();

          const res = await fetchWithCsrf(`${API_PREFIX}/paypal/create-order/`, {
            method: "POST",
          });

          if (!res.ok) {
            const j = await res.json().catch(() => null);
            throw new Error(j?.error || j?.detail || `Failed (${res.status})`);
          }
          const j = await res.json();
          setOrderId(j.orderID);
          return j.orderID;
        } catch (e) {
          setErr(e.message || String(e));
          throw e;
        } finally {
          setLoading(false);
        }
      },

      onApprove: async (data, actions) => {
        try {
          setLoading(true);
          const res = await fetchWithCsrf(`${API_PREFIX}/paypal/capture-order/`, {
            method: "POST",
            body: JSON.stringify({ orderID: data.orderID }),
          });
          const j = await res.json().catch(() => null);
          if (!res.ok) {
            throw new Error(j?.error || j?.detail || `Failed capture (${res?.status})`);
          }
          setShowDone(true);
        } catch (e) {
          setErr(e.message || String(e));
        } finally {
          setLoading(false);
        }
      },

      onError: (err2) => {
        setErr(String(err2 || "PayPal error"));
      },

      onCancel: (data) => {
        // user cancelled
      },
    }).render(containerRef.current);
  }, [containerRef.current, window.paypal, amount]);

  return (
    <div className={styles.container}>
      <div className={styles.box}>
        <div className={styles.header}>
          <FaPaypal className={styles.paypalIcon} />
          <h3>Secure Checkout</h3>
        </div>
        
        <div className={styles.summary}>
          <div>Transaction</div>
          <div className={styles.amount}>
            {amount ? `${currency} ${amount}` : "..."}
          </div>
        </div>

        <div className={styles.securityNote}>
          <FaLock className={styles.lockIcon} />
          <span>Your payment is secure and encrypted</span>
        </div>

        <div ref={containerRef} className={styles.paypalButton} />

        {loading && (
          <div className={styles.loading}>
            <FaSpinner className={styles.spinner} />
            Processing your payment...
          </div>
        )}
        {err && <ErrorToast message={err} />}

        {showDone && <Paymentdone message="Payment successful — subscriptions created" />}
      </div>
    </div>
  );
}