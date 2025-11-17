// GrowthBarChart.jsx
import React, { useEffect, useState } from 'react';
import styles from './GrowthBarChart.module.css';

const RANGE_OPTIONS = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: 'Last 7 days' },
  { key: '14d', label: 'Last 14 days' },
  { key: 'month', label: 'This month' },
  { key: '3m', label: 'Last 3 months' },
  { key: '6m', label: 'Last 6 months' },
  { key: 'year', label: 'This year' },
  { key: 'last_year', label: 'Last year' },
];

const COLOR_SCHEMES = {
  revenue: {
    bar: 'linear-gradient(180deg, #8b5cf6 0%, #7c3aed 100%)',
    card: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    glow: 'rgba(139, 92, 246, 0.3)'
  },
  users: {
    bar: 'linear-gradient(180deg, #10b981 0%, #059669 100%)',
    card: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    glow: 'rgba(16, 185, 129, 0.3)'
  },
  subscriptions: {
    bar: 'linear-gradient(180deg, #f59e0b 0%, #d97706 100%)',
    card: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    glow: 'rgba(245, 158, 11, 0.3)'
  },
  visitors: {
    bar: 'linear-gradient(180deg, #ef476f 0%, #dc2626 100%)',
    card: 'linear-gradient(135deg, #ef476f 0%, #dc2626 100%)',
    glow: 'rgba(239, 71, 111, 0.3)'
  }
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

async function fetchCsrfToken() {
  const res = await fetch(`${API_BASE}/api/csrf/`, { method: 'GET', credentials: 'include' });
  if (!res.ok) throw new Error('Failed to get CSRF');
  const data = await res.json();
  return data.csrfToken;
}

async function fetchOverview(range) {
  const csrf = await fetchCsrfToken();
  const res = await fetch(`${API_BASE}/api/admin/overview-bars/?range=${encodeURIComponent(range)}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrf || '',
    },
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Overview fetch failed: ${res.status} ${txt}`);
  }
  return res.json();
}

const GrowthBarChart = () => {
  const [range, setRange] = useState('month');
  const [graphData, setGraphData] = useState([
    { label: 'Revenue', raw_current: 0, raw_previous: 0, percent_change: 0, type: 'revenue' },
    { label: 'Regular Users', raw_current: 0, raw_previous: 0, percent_change: 0, type: 'users' },
    { label: 'Active Subscriptions', raw_current: 0, raw_previous: 0, percent_change: 0, type: 'subscriptions' },
    { label: 'Visitors', raw_current: 0, raw_previous: 0, percent_change: 0, type: 'visitors' },
  ]);
  const [meta, setMeta] = useState({
    total_regular_users: 0,
    revenue_current: 0,
    active_subscriptions_now: 0,
    total_visitors: 0,
    start: null,
    end: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const payload = await fetchOverview(range);
        if (cancelled) return;

        const gd = payload.graph_data || [];
        const ordered = [
          { ...(gd.find(g => g.label === 'Revenue') || { label: 'Revenue', raw_current: 0, raw_previous: 0, percent_change: 0 }), type: 'revenue' },
          { ...(gd.find(g => g.label === 'Regular Users') || { label: 'Regular Users', raw_current: 0, raw_previous: 0, percent_change: 0 }), type: 'users' },
          { ...(gd.find(g => g.label === 'Active Subscriptions') || { label: 'Active Subscriptions', raw_current: 0, raw_previous: 0, percent_change: 0 }), type: 'subscriptions' },
          { ...(gd.find(g => g.label === 'Visitors') || { label: 'Visitors', raw_current: 0, raw_previous: 0, percent_change: 0 }), type: 'visitors' },
        ];

        setGraphData(ordered);
        setMeta({
          total_regular_users: payload.total_regular_users || 0,
          revenue_current: payload.revenue_current || 0,
          active_subscriptions_now: payload.active_subscriptions_now || 0,
          total_visitors: payload.total_visitors || 0,
          start: payload.start || null,
          end: payload.end || null,
        });
      } catch (err) {
        if (process.env.NODE_ENV === 'development') console.warn('GrowthBarChart load failed:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const id = setInterval(load, 300_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [range]);

  // Determine normalization baseline for bar heights.
  // Use percent_change absolute values when available; otherwise fall back to raw_current.
  const valuesForHeight = graphData.map(g => {
    const pct = g.percent_change;
    if (pct === null || pct === undefined || Number.isNaN(Number(pct))) {
      return Math.max(0, Number(g.raw_current) || 0);
    }
    return Math.abs(Number(pct));
  });

  const maxValue = Math.max(...valuesForHeight, 1);

  const bars = graphData.map((g) => {
    const rawCurrent = Number(g.raw_current) || 0;
    const rawPrev = Number(g.raw_previous) || 0;
    const pct = (g.percent_change === null || g.percent_change === undefined) ? null : Number(g.percent_change);
    const baseForHeight = (pct === null || pct === undefined || Number.isNaN(pct)) ? rawCurrent : Math.abs(pct);
    const heightPct = (baseForHeight / maxValue) * 100;
    return { ...g, heightPct: Math.max(4, heightPct), rawCurrent, rawPrev, pct };
  });

  const fmtNumber = (n) => {
    if (n === null || n === undefined) return '—';
    return typeof n === 'number' && Number.isFinite(n) ? n.toLocaleString() : String(n);
  };

  const fmtCurrency = (n) => {
    if (n === null || n === undefined) return '—';
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
  };

  const fmtPct = (p) => {
    if (p === null || p === undefined || Number.isNaN(Number(p))) return '—';
    const rounded = Math.round(p * 10) / 10; // one decimal
    return (rounded > 0 ? `+${rounded}%` : `${rounded}%`);
  };

  const getBarStyle = (item) => ({
    height: `${item.heightPct}%`,
    '--bar-gradient': COLOR_SCHEMES[item.type].bar,
    '--bar-glow': COLOR_SCHEMES[item.type].glow,
  });

  const summaryItems = [
    { 
      label: 'Total Revenue', 
      value: meta.revenue_current, 
      formatter: fmtCurrency, 
      type: 'revenue',
      icon: '💰',
      trendPct: (graphData[0] && graphData[0].percent_change) || 0
    },
    { 
      label: 'Regular Users', 
      value: meta.total_regular_users, 
      formatter: fmtNumber, 
      type: 'users',
      icon: '👥',
      trendPct: (graphData[1] && graphData[1].percent_change) || 0
    },
    { 
      label: 'Active Subscriptions', 
      value: meta.active_subscriptions_now, 
      formatter: fmtNumber, 
      type: 'subscriptions',
      icon: '🔄',
      trendPct: (graphData[2] && graphData[2].percent_change) || 0
    },
    { 
      label: 'Visitors', 
      value: meta.total_visitors, 
      formatter: fmtNumber, 
      type: 'visitors',
      icon: '👀',
      trendPct: (graphData[3] && graphData[3].percent_change) || 0
    },
  ];

  return (
    <div className={styles.chartContainer}>
      {/* Header Section */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <div className={styles.chartTitle}>Rushhourcamp Growth Dashboard</div>
          <div className={styles.chartSubtitle}>Track your key metrics and performance indicators</div>
        </div>

        <div className={styles.rangeSelect}>
          <div className={styles.rangeLabel}>Time Range</div>
          <select
            className={styles.select}
            value={range}
            onChange={(e) => setRange(e.target.value)}
            disabled={loading}
          >
            {RANGE_OPTIONS.map(opt => (
              <option key={opt.key} value={opt.key}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner}></div>
          <div className={styles.loadingText}>...</div>
        </div>
      )}

      {/* Chart Area */}
      <div className={styles.chartArea}>
        <div className={styles.chart}>
          {/* Grid Lines */}
          <div className={styles.gridLines}>
            {[100, 75, 50, 25, 0].map((percent) => (
              <div key={percent} className={styles.gridLine}>
                <span className={styles.gridLabel}>{percent}%</span>
              </div>
            ))}
          </div>

          {/* Bars Container */}
          <div className={styles.barsContainer}>
            {bars.map((item) => (
              <div key={item.label} className={styles.barGroup}>
                <div className={styles.barWrapper}>
                  <div
                    className={`${styles.bar} ${loading ? styles.barLoading : ''}`}
                    style={getBarStyle(item)}
                    title={`${item.label}\nCurrent: ${item.type === 'revenue' ? fmtCurrency(item.rawCurrent) : fmtNumber(item.rawCurrent)}\nPrevious: ${item.type === 'revenue' ? fmtCurrency(item.rawPrev) : fmtNumber(item.rawPrev)}\nChange: ${fmtPct(item.pct)}`}
                  >
                    <div className={styles.barFill}>
                      <div className={styles.barValue}>
                        {/* display primary current value */}
                        <div style={{ fontWeight: 600 }}>
                          {item.type === 'revenue' ? fmtCurrency(item.rawCurrent) : fmtNumber(item.rawCurrent)}
                        </div>
                        {/* small percent change below */}
                        <div style={{ fontSize: '0.75rem', marginTop: 4 }}>
                          {fmtPct(item.pct)}
                        </div>
                      </div>
                    </div>
                    <div className={styles.barGlow}></div>
                  </div>
                </div>
                <div className={styles.barLabel}>
                  <span>{item.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        {summaryItems.map((item) => (
          <div key={item.label} className={styles.summaryCard}>
            <div 
              className={styles.summaryIcon} 
              style={{ background: COLOR_SCHEMES[item.type].card }}
            >
              {item.icon}
            </div>
            <div className={styles.summaryContent}>
              <div className={styles.summaryLabel}>{item.label}</div>
              <div className={styles.summaryValue}>{item.formatter(item.value)}</div>
              <div 
                className={styles.summaryTrend}
                style={{ color: (item.trendPct === null || item.trendPct === undefined) ? '#64748b' : (item.trendPct >= 0 ? '#10b981' : '#ef4444') }}
              >
                {fmtPct(item.trendPct)} growth
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GrowthBarChart;
