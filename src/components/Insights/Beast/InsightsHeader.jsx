// components/insights/InsightsHeader.jsx
"use client";

import React from "react";
import styles from "./InsightsHeader.module.css";

export default function InsightsHeader({ 
  totalViews, 
  activeCount, 
  campaignsCount, 
  announcementsCount,
  filter,
  sortBy,
  onFilterChange,
  onSortChange 
}) {
  const stats = [
    { icon: "✨", label: "Total Views", value: totalViews.toLocaleString() },
    { icon: "🟢", label: "Active Items", value: activeCount },
    { icon: "🎯", label: "Campaigns", value: campaignsCount },
    { icon: "📢", label: "Announcements", value: announcementsCount },
  ];

  return (
    <header className={styles.header}>
      <div className={styles.hero}>
        <h1 className={styles.title}>
          <span className={styles.titleIcon}>📊</span>
          Insights Dashboard
        </h1>
        <p className={styles.subtitle}>
          Track performance and engagement across your campaigns and announcements
        </p>
      </div>
      
      <div className={styles.statsGrid}>
        {stats.map((stat, index) => (
          <div 
            key={stat.label}
            className={styles.statCard}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className={styles.statIcon}>{stat.icon}</div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stat.value}</div>
              <div className={styles.statLabel}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>
      
      <div className={styles.controls}>
        <div className={styles.filterGroup}>
          <span className={styles.controlLabel}>🎚️ Filter:</span>
          <div className={styles.filterButtons}>
            {[
              { value: "all", label: "All", icon: "🌐" },
              { value: "active", label: "Active", icon: "🟢" },
              { value: "inactive", label: "Inactive", icon: "⚫" }
            ].map(({ value, label, icon }) => (
              <button
                key={value}
                className={`${styles.filterButton} ${filter === value ? styles.active : ''}`}
                onClick={() => onFilterChange(value)}
              >
                <span className={styles.buttonIcon}>{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}