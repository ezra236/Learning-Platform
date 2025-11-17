// components/PurchaseModal.jsx
import React, { useEffect, useRef, useState } from "react";
import styles from "./PurchaseModal.module.css";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";
const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
const PAYPAL_CURRENCY = process.env.NEXT_PUBLIC_PAYPAL_CURRENCY || "USD";

function getCookie(name) {
  if (typeof document === "undefined") return null;
  const cookies = document.cookie ? document.cookie.split("; ") : [];
  for (let i = 0; i < cookies.length; i++) {
    const parts = cookies[i].split("=");
    const key = decodeURIComponent(parts.shift());
    const val = parts.join("=");
    if (key === name) return decodeURIComponent(val);
  }
  return null;
}

export default function PurchaseModal({ sessionId, pdf, onClose }) {
  const [email, setEmail] = useState("");
  const [stage, setStage] = useState("enter_email");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const paypalRef = useRef(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    if (!scriptLoaded && PAYPAL_CLIENT_ID) {
      const script = document.createElement("script");
      script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=${PAYPAL_CURRENCY}`;
      script.async = true;
      script.onload = () => setScriptLoaded(true);
      script.onerror = () => setError("Failed to load PayPal script");
      document.body.appendChild(script);
    } else if (PAYPAL_CLIENT_ID) {
      setScriptLoaded(true);
    }
  }, [scriptLoaded]);

  useEffect(() => {
    if (stage !== "pay" || !scriptLoaded) return;
    if (!window.paypal) {
      setError("PayPal SDK not available");
      return;
    }

    setProcessingPayment(false);

    window.paypal.Buttons({
      style: { 
        layout: "vertical",
        shape: "rect",
        color: "gold",
        height: 48,
        label: "paypal"
      },
      createOrder: async function () {
        setProcessingPayment(true);
        try {
          const csrftoken = getCookie("csrftoken");
          const res = await fetch(`${API_BASE}/api/public/create-paypal-order/`, {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              ...(csrftoken ? { "X-CSRFToken": csrftoken } : {}),
            },
            body: JSON.stringify({ session_id: sessionId, currency: PAYPAL_CURRENCY }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Failed creating PayPal order");
          return data.orderID;
        } catch (err) {
          setError(err.message || "Failed to create order");
          setProcessingPayment(false);
          throw err;
        }
      },
      onApprove: async function (data, actions) {
        try {
          const capture = await actions.order.capture();
          const csrftoken = getCookie("csrftoken");
          const res = await fetch(`${API_BASE}/api/public/complete-order/`, {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              ...(csrftoken ? { "X-CSRFToken": csrftoken } : {}),
            },
            body: JSON.stringify({ session_id: sessionId, orderID: data.orderID }),
          });
          const serverResult = await res.json();
          if (!res.ok) throw new Error(serverResult.error || "Failed to complete order on server");
          setStage("done");
        } catch (err) {
          console.error(err);
          setError(err.message || "Payment verification failed");
        } finally {
          setProcessingPayment(false);
        }
      },
      onCancel: function () {
        setProcessingPayment(false);
      },
      onError: function (err) {
        console.error("PayPal Buttons error", err);
        setError("PayPal error: " + (err && err.toString ? err.toString() : err));
        setProcessingPayment(false);
      },
    }).render(paypalRef.current);
  }, [stage, scriptLoaded, sessionId]);

  const submitEmail = async (e) => {
    e.preventDefault();
    setError(null);
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setSubmitting(true);
    try {
      const csrftoken = getCookie("csrftoken");
      const res = await fetch(`${API_BASE}/api/public/purchase_sessions/${sessionId}/set_email/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(csrftoken ? { "X-CSRFToken": csrftoken } : {}),
        },
        body: JSON.stringify({ buyer_email: email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to set email");
      setStage("pay");
    } catch (err) {
      setError(err.message || "Failed to set email");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.close} onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className={styles.modalHeader}>
          <div className={styles.modalIcon}>📄</div>
          <h2 className={styles.modalTitle}>Purchase PDF</h2>
        </div>

        <div className={styles.productInfo}>
          <h3 className={styles.productName}>{pdf.name}</h3>
          <div className={styles.priceSection}>
            <span className={styles.priceLabel}>Total Amount:</span>
            <span className={styles.price}>${pdf.price}</span>
          </div>
        </div>

        {stage === "enter_email" && (
          <form className={styles.form} onSubmit={submitEmail}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                <span className={styles.labelIcon}>📧</span>
                Your Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className={styles.input}
                disabled={submitting}
              />
              <div className={styles.helpText}>
                🔒 We'll send your PDF download link to this email
              </div>
            </div>
            <div className={styles.actions}>
              <button 
                type="submit" 
                disabled={submitting}
                className={`${styles.continueBtn} ${submitting ? styles.loading : ''}`}
              >
                <span className={styles.btnIcon}>
                  {submitting ? <div className={styles.spinnerSmall} /> : '➡️'}
                </span>
                {submitting ? "Processing..." : "Continue to Payment"}
              </button>
            </div>
          </form>
        )}

        {stage === "pay" && (
          <div className={styles.payContainer}>
            <div className={styles.paymentHeader}>
              <div className={styles.paymentIcon}>💳</div>
              <h4>Secure Payment</h4>
            </div>
            
            {processingPayment && (
              <div className={styles.paymentLoading}>
                <div className={styles.spinner} />
                <p>Preparing secure payment...</p>
              </div>
            )}
            
            <div ref={paypalRef} className={styles.paypalButtons} />
            
            <div className={styles.help}>
              <div className={styles.helpIcon}>ℹ️</div>
              <p>After clicking PayPal, a secure window will open to complete your payment</p>
            </div>
          </div>
        )}

        {stage === "done" && (
          <div className={styles.success}>
            <div className={styles.successIcon}>🎉</div>
            <h3 className={styles.successTitle}>Payment Successful!</h3>
            <p className={styles.successMessage}>
              Thank you for your purchase! Your PDF will be delivered to your email shortly.
              A notification has been sent to our team.
            </p>
            <div className={styles.successActions}>
              <button onClick={onClose} className={styles.successBtn}>
                👍 Got It
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className={styles.error}>
            <div className={styles.errorIcon}>⚠️</div>
            <div className={styles.errorText}>{error}</div>
            <button 
              className={styles.errorRetry} 
              onClick={() => setError(null)}
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}