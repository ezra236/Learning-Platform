// components/insights/Insights.jsx
"use client";

import React, { useEffect, useState, useMemo } from "react";
import Campaign from "./Campaign";
import InsightsHeader from "./InsightsHeader";
import LoadingState from "./LoadingState";
import ErrorState from "./ErrorState";
import EmptyState from "./EmptyState";
import styles from "./Insights.module.css";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

async function ensureCsrf() {
  try {
    await fetch(`${API_BASE}/api/csrf/`, {
      method: "GET",
      credentials: "include",
      headers: { "Accept": "application/json" },
    });
  } catch (err) {
    console.warn("Failed to fetch csrf token", err);
  }
}

export default function Insights() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // all, active, inactive
  const [sortBy, setSortBy] = useState("views"); // views, recent, alphabetical

  const filteredCampaigns = useMemo(() => {
    let filtered = campaigns;

    if (filter === "active") {
      filtered = filtered.filter((c) => c.is_active);
    } else if (filter === "inactive") {
      filtered = filtered.filter((c) => !c.is_active);
    }

    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "views":
          return (b.views_count || 0) - (a.views_count || 0);
        case "recent":
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        case "alphabetical":
          return (a.heading || "").localeCompare(b.heading || "");
        default:
          return 0;
      }
    });

    return filtered;
  }, [campaigns, filter, sortBy]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);
      await ensureCsrf();

      try {
        const cRes = await fetch(`${API_BASE}/api/campaignsinsights/`, {
          credentials: "include",
        });

        if (!cRes.ok) {
          const msg = `Failed to load campaigns: ${cRes.status}`;
          throw new Error(msg);
        }

        const cJson = await cRes.json();

        if (mounted) {
          setCampaigns(cJson.results || []);
        }
      } catch (err) {
        console.error(err);
        if (mounted) setError(err.message || "Failed to load insights");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const totalViews = useMemo(() => {
    return campaigns.reduce((sum, c) => sum + (c.views_count || 0), 0);
  }, [campaigns]);

  const activeCount = useMemo(() => {
    return campaigns.filter((c) => c.is_active).length;
  }, [campaigns]);

  if (loading) {
    return <LoadingState type="insights" />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className={styles.container}>
      <InsightsHeader
        totalViews={totalViews}
        activeCount={activeCount}
        campaignsCount={campaigns.length}
        filter={filter}
        sortBy={sortBy}
        onFilterChange={setFilter}
        onSortChange={setSortBy}
      />

      <div className={styles.content}>
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>
              <span className={styles.icon}>🎯</span>
              Campaign Performance
              <span className={styles.countBadge}>{filteredCampaigns.length}</span>
            </div>
            <div className={styles.sectionControls}>
              <select
                className={styles.select}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="views">🔥 Most Viewed</option>
                <option value="recent">🕒 Recently Added</option>
                <option value="alphabetical">🔤 Alphabetical</option>
              </select>
            </div>
          </div>

          <div className={styles.grid}>
            {filteredCampaigns.map((campaign) => (
              <Campaign key={campaign.id} campaign={campaign} />
            ))}
          </div>

          {filteredCampaigns.length === 0 && (
            <EmptyState
              icon="🎯"
              title="No campaigns found"
              message={
                filter !== "all"
                  ? `Try changing the filter to see ${filter === "active" ? "inactive" : "active"} campaigns`
                  : "Create your first campaign to get started"
              }
            />
          )}
        </section>
      </div>
    </div>
  );
}
