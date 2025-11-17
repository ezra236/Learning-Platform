// Paymentdone.jsx
"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import styles from "./paymentdone.module.css";
import { FaCheckCircle, FaArrowRight } from "react-icons/fa";

export default function Paymentdone({ message = "Payment successful — subscriptions created" }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // avoid SSR mismatch: only render portal on client
    setMounted(true);

    const timer = setTimeout(() => {
      router.push("/user/dashboard/");
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  if (!mounted) return null;

  return createPortal(
    <div className={styles.overlay}>
      <div className={styles.card}>
        <div className={styles.successIcon}>
          <FaCheckCircle />
        </div>
        <h2>Payment Successful!</h2>
        <p>{message}</p>
        <div className={styles.redirect}>
          <FaArrowRight className={styles.arrow} />
          <span>Redirecting to your dashboard...</span>
        </div>
        <div className={styles.progressBar}>
          <div className={styles.progress}></div>
        </div>
      </div>
    </div>,
    document.body
  );
}
