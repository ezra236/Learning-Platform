// GrowthPieChart.jsx
import React, { useState, useEffect } from 'react';
import styles from './GrowthPieChart.module.css';

export default function GrowthPieChart() {
  const [activeSegment, setActiveSegment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // fetched counts from API
  const [counts, setCounts] = useState({
    total_regular_users: null,
    active_users: 0,
    new_signups: 0,
    new_signins: 0,
    inactive_email_not_verified: 0,
    banned_users: 0,
  });

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

  async function fetchCsrfToken() {
    const res = await fetch(`${API_BASE}/api/csrf/`, { method: "GET", credentials: "include" });
    if (!res.ok) throw new Error("Failed to get CSRF token");
    const data = await res.json();
    return data.csrfToken;
  }

  async function fetchPieData(csrfToken) {
    const res = await fetch(`${API_BASE}/api/admin/growth-pie-data/`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken || "",
      },
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`Failed to fetch pie data: ${res.status} ${txt}`);
    }
    return res.json();
  }

  useEffect(() => {
    let cancelled = false;

    async function loadOnce() {
      try {
        setIsLoading(true);
        const csrf = await fetchCsrfToken();
        const payload = await fetchPieData(csrf);
        if (cancelled) return;

        setCounts({
          total_regular_users: payload.total_regular_users ?? 0,
          active_users: payload.active_users ?? 0,
          new_signups: payload.new_signups ?? 0,
          new_signins: payload.new_signins ?? 0,
          inactive_email_not_verified: payload.inactive_email_not_verified ?? 0,
          banned_users: payload.banned_users ?? 0,
        });
      } catch (err) {
        // silent failure per your requirement
        if (process.env.NODE_ENV === "development") {
          console.warn("GrowthPieChart fetch failed:", err);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadOnce();
    const id = setInterval(loadOnce, 300_000); // 5 minutes
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // Build full items array (preserve original labels/colors order)
  const totalUsers = counts.total_regular_users || 0;
  const safeTotal = totalUsers === 0 ? 1 : totalUsers;

  const fullItems = [
    { 
      label: 'Active Users', 
      value: (counts.active_users / safeTotal) * 100, 
      color: '#10b981', 
      users: counts.active_users,
      icon: '🟢'
    },
    { 
      label: 'New Signups', 
      value: (counts.new_signups / safeTotal) * 100, 
      color: '#3b82f6', 
      users: counts.new_signups,
      icon: '🆕'
    },
    { 
      label: 'New Signins', 
      value: (counts.new_signins / safeTotal) * 100, 
      color: '#8b5cf6', 
      users: counts.new_signins,
      icon: '🔑'
    },
    { 
      label: 'Inactive', 
      value: (counts.inactive_email_not_verified / safeTotal) * 100, 
      color: '#6b7280', 
      users: counts.inactive_email_not_verified,
      icon: '⏸️'
    },
    { 
      label: 'Banned', 
      value: (counts.banned_users / safeTotal) * 100, 
      color: '#ef4444', 
      users: counts.banned_users,
      icon: '🚫'
    }
  ];

  // Filter out zero-user categories (treat tiny rounding values as zero)
  const EPS = 1e-9;
  const filteredItems = fullItems.filter(it => (it.users || 0) > 0 && (it.value || 0) > EPS);

  // If everything filtered out (no data), fall back to showing all items but with zero percentages
  const itemsToUse = filteredItems.length > 0 ? filteredItems : fullItems.map(it => ({ ...it, value: 0 }));

  // Normalize so percentages sum to 100 (avoids small gaps/overflow due to rounding)
  const totalRawPercent = itemsToUse.reduce((s, it) => s + it.value, 0);
  const normalized = totalRawPercent > 0
    ? itemsToUse.map(it => ({ ...it, pct: (it.value / totalRawPercent) * 100 }))
    : itemsToUse.map(it => ({ ...it, pct: 0 }));

  // For display in legend we keep user counts as integer numbers (but only for itemsToUse)
  const data = normalized.map(it => ({ 
    label: it.label, 
    value: it.pct, 
    color: it.color, 
    users: it.users,
    icon: it.icon
  }));

  // Build conic-gradient string using cumulative percentages
  const cumulative = [];
  let acc = 0;
  for (let i = 0; i < data.length; i++) {
    const start = acc;
    const end = acc + data[i].value;
    cumulative.push({ ...data[i], start, end });
    acc = end;
  }

  // If cumulative sums to 0 (no real data), show a neutral gray circle
  const gradientString = (acc <= EPS)
    ? `#e5e7eb 0% 100%`
    : cumulative
        .map((item) => {
          const s = Math.max(0, Math.min(100, item.start));
          const e = Math.max(0, Math.min(100, item.end));
          return `${item.color} ${s}% ${e}%`;
        })
        .join(', ');

  if (isLoading) {
    return (
      <div className={styles.chartContainer}>
        <div className={styles.skeletonLoader}>
          <div className={styles.skeletonHeader}></div>
          <div className={styles.skeletonContent}>
            <div className={styles.skeletonPie}></div>
            <div className={styles.skeletonLegend}>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className={styles.skeletonLegendItem}></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartHeader}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <div className={styles.titleIcon}>📊</div>
            <div>
              <h3 className={styles.chartTitle}>User Analytics Overview</h3>
              <p className={styles.chartSubtitle}>Monthly user distribution and engagement metrics</p>
            </div>
          </div>
          <div className={styles.lastUpdated}>
            <span className={styles.updateDot}></span>
            Live data
          </div>
        </div>
      </div>
      
      <div className={styles.chartContent}>
        <div className={styles.pieChartContainer}>
          <div 
            className={`${styles.pieChart} ${activeSegment !== null ? styles.hasActiveSegment : ''}`}
            style={{
              background: `conic-gradient(${gradientString})`
            }}
          >
            <div className={styles.pieCenter}></div>
          </div>
          
          <div className={styles.chartCenter}>
            <span className={styles.totalValue}>{(totalUsers).toLocaleString()}</span>
            <span className={styles.totalLabel}>Total Users</span>
          </div>

          {/* Interactive segments */}
          {data.map((item, index) => {
            const startAngle = cumulative[index]?.start * 3.6 || 0;
            const endAngle = cumulative[index]?.end * 3.6 || 0;
            
            return (
              <div
                key={index}
                className={`${styles.pieSegment} ${activeSegment === index ? styles.active : ''}`}
                style={{
                  '--start-angle': `${startAngle}deg`,
                  '--end-angle': `${endAngle}deg`,
                  '--segment-color': item.color
                }}
                onMouseEnter={() => setActiveSegment(index)}
                onMouseLeave={() => setActiveSegment(null)}
              ></div>
            );
          })}
        </div>
        
        <div className={styles.legend}>
          {data.map((item, index) => (
            <div 
              key={index} 
              className={`${styles.legendItem} ${activeSegment === index ? styles.active : ''}`}
              onMouseEnter={() => setActiveSegment(index)}
              onMouseLeave={() => setActiveSegment(null)}
            >
              <div className={styles.legendMain}>
                <div 
                  className={styles.legendColor}
                  style={{ backgroundColor: item.color }}
                ></div>
                <div className={styles.legendContent}>
                  <div className={styles.legendHeader}>
                    <span className={styles.legendIcon}>{item.icon}</span>
                    <span className={styles.legendLabel}>{item.label}</span>
                  </div>
                  <div className={styles.legendDetails}>
                    <span className={styles.legendValue}>{Math.round(item.value)}%</span>
                    <span className={styles.legendUsers}>• {(item.users || 0).toLocaleString()} users</span>
                  </div>
                </div>
              </div>
              {activeSegment === index && (
                <div className={styles.legendTooltip}>
                  {Math.round(item.value)}% of total users
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className={styles.chartStats}>
        <div className={styles.stat}>
          <div className={styles.statIcon}>📈</div>
          <div className={styles.statContent}>
            <span className={styles.statNumber}>
              { totalUsers ? Math.round((counts.active_users / totalUsers) * 100) + '%' : '0%' }
            </span>
            <span className={styles.statText}>Active Rate</span>
          </div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statIcon}>🌱</div>
          <div className={styles.statContent}>
            <span className={styles.statNumber}>
              { totalUsers ? Math.round((counts.new_signups / totalUsers) * 100 * 10) / 10 + '%' : '0%' }
            </span>
            <span className={styles.statText}>Growth Rate</span>
          </div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statIcon}>🔄</div>
          <div className={styles.statContent}>
            <span className={styles.statNumber}>
              { totalUsers ? Math.round((counts.banned_users / totalUsers) * 100 * 10) / 10 + '%' : '0%' }
            </span>
            <span className={styles.statText}>Churn Rate</span>
          </div>
        </div>
      </div>
    </div>
  );
}