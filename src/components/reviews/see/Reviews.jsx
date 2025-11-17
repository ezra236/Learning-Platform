"use client";

import React, { useEffect, useState, useCallback } from "react";
import styles from "./Reviews.module.css";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCsrf = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/api/csrf/`, {
        method: "GET",
        credentials: "include",
      });
    } catch (err) {
      console.warn("csrf fetch failed:", err);
    }
  }, []);

  const fetchReviews = useCallback(async () => {
    setError(null);

    try {
      await fetchCsrf();

      const res = await fetch(`${API_BASE}/api/reviews/`, {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      if (res.status === 401) {
        setError("Not authenticated. Please sign in.");
        setReviews([]);
        return;
      }

      if (res.status === 403) {
        setError("Forbidden: you must be a superadmin to view reviews.");
        setReviews([]);
        return;
      }

      if (!res.ok) {
        const txt = await res.text();
        try {
          const j = JSON.parse(txt);
          setError(j.error || j.detail || `Request failed: ${res.status}`);
        } catch {
          setError(`Request failed: ${res.status} ${txt}`);
        }
        return;
      }

      const data = await res.json();
      const list = Array.isArray(data) ? data : data.reviews || data.results || [];
      setReviews(list);
    } catch (err) {
      setError("Network or unexpected error: " + String(err));
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [fetchCsrf]);

  useEffect(() => {
    fetchReviews();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchReviews, 30000);
    return () => clearInterval(interval);
  }, [fetchReviews]);

  function formatDate(iso) {
    try {
      const d = new Date(iso);
      return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
        Math.ceil((d - new Date()) / (1000 * 60 * 60 * 24)),
        'day'
      );
    } catch {
      return iso;
    }
  }

  function getInitials(id) {
    return `U${id}`.slice(0, 2).toUpperCase();
  }

  function getRandomColor() {
    const colors = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Customer Reviews</h1>
          <p className={styles.subtitle}>Real feedback from our community</p>
          {!loading && (
            <div className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.statNumber}>{reviews.length}</span>
                <span className={styles.statLabel}>Total Reviews</span>
              </div>
              <div className={styles.liveIndicator}>
                <div className={styles.pulse}></div>
                Live Updates
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.content}>
        {loading && (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingCards}>
              {[1, 2, 3].map((i) => (
                <div key={i} className={styles.skeletonCard}>
                  <div className={styles.skeletonHeader}>
                    <div className={styles.skeletonAvatar}></div>
                    <div className={styles.skeletonText}>
                      <div className={styles.skeletonLine}></div>
                      <div className={styles.skeletonLineShort}></div>
                    </div>
                  </div>
                  <div className={styles.skeletonContent}>
                    <div className={styles.skeletonParagraph}></div>
                    <div className={styles.skeletonParagraph}></div>
                    <div className={styles.skeletonParagraphShort}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && !loading && (
          <div className={styles.errorContainer}>
            <div className={styles.errorCard}>
              <div className={styles.errorIcon}>⚠️</div>
              <div className={styles.errorText}>
                <h3>Unable to Load Reviews</h3>
                <p>{error}</p>
              </div>
              <button 
                className={styles.retryButton}
                onClick={fetchReviews}
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {!loading && !error && reviews.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIllustration}>
              <div className={styles.emptyIcon}>💬</div>
            </div>
            <h2>No Reviews Yet</h2>
            <p>Be the first to share your experience with us!</p>
          </div>
        )}

        {!loading && !error && reviews.length > 0 && (
          <div className={styles.reviewsGrid}>
            {reviews.map((review, index) => {
              const id = review.id ?? review.pk ?? "unknown";
              const text = review.text ?? review.body ?? "";
              const created = review.created_at ?? review.createdAt ?? review.created ?? null;
              
              return (
                <article 
                  key={String(id)} 
                  className={styles.reviewCard}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className={styles.cardHeader}>
                    <div 
                      className={styles.avatar}
                      style={{ background: getRandomColor() }}
                    >
                      {getInitials(id)}
                    </div>
                    <div className={styles.userInfo}>
                      {created && (
                        <time className={styles.timestamp}>{formatDate(created)}</time>
                      )}
                    </div>
                    <div className={styles.ratingIndicator}>
                      <div className={styles.ratingStars}>
                        {"★".repeat(5)}
                      </div>
                    </div>
                  </div>
                  
                  <div className={styles.cardContent}>
                    <p className={styles.reviewText}>{text}</p>
                  </div>
                  
                  <div className={styles.cardFooter}>
                    <div className={styles.reviewMeta}>
                      <span className={styles.reviewId}>Review {id}</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}