// components/NewsletterForm.jsx
import React, { useState } from "react";
import styles from "./newsletter.module.css";
import NewsSuccess from "./NewsSuccess";

const NewsletterForm = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [error, setError] = useState(null);

  const getCookie = (name) => {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
  };

  // Force-get CSRF cookie from server (will set cookie)
  const ensureCsrfCookie = async () => {
    await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/csrfs/`, {
      method: "GET",
      credentials: "include",
    });
  };

  const submitEmail = async (e) => {
    e && e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email) {
      setError("Please enter an email address.");
      return;
    }

    setLoading(true);
    try {
      // Ensure CSRF cookie is set
      await ensureCsrfCookie();

      const csrftoken = getCookie("csrftoken");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/newsletter/subscribe/`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrftoken || "",
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        // Prefer readable message from server
        const msg = data.detail || data.message || "Subscription failed.";
        throw new Error(msg);
      }

      setSuccessMsg(data.message || "Subscribed successfully.");
      setEmail("");
    } catch (err) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form className={styles.form} onSubmit={submitEmail}>
        <div className={styles.fieldRow}>
          <input
            id="newsletter-email"
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
            required
          />
          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? "Subscribing..." : "Subscribe"}
          </button>
        </div>
        {error && <div className={styles.error}>{error}</div>}
      </form>

      {successMsg && (
        <NewsSuccess
          message={successMsg}
          onClose={() => setSuccessMsg(null)}
          duration={5000}
        />
      )}
    </>
  );
};

export default NewsletterForm;
