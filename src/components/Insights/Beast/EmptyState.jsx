// components/insights/EmptyState.jsx
"use client";

import React from "react";
import styles from "./EmptyState.module.css";

export default function EmptyState({ icon = "📭", title, message }) {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.icon}>{icon}</div>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.message}>{message}</p>
        <div className={styles.decoration}>
          <div className={styles.orb} style={{ animationDelay: "0s" }}></div>
          <div className={styles.orb} style={{ animationDelay: "0.5s" }}></div>
          <div className={styles.orb} style={{ animationDelay: "1s" }}></div>
        </div>
      </div>
    </div>
  );
}