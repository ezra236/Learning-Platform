import React, { useEffect, useState, useRef } from "react";
import styles from "./subscription.module.css";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

function formatRemaining(seconds) {
  if (seconds == null) return "Unknown";
  if (seconds <= 0) return "Expired";

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days} day${days === 1 ? "" : "s"}`;
  }
  if (hours > 0) {
    return `${hours} hour${hours === 1 ? "" : "s"}`;
  }
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}

function formatLocal(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

export default function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/subscriptions/`, {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        });

        if (res.status === 401) {
          window.location.href = "/user/signin/";
          return;
        }
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(payload.detail || payload.error || "Failed to load subscriptions.");
        }

        const json = await res.json();
        if (mounted) {
          setSubscriptions(json.subscriptions || []);
          setError(null);
        }
      } catch (err) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();

    intervalRef.current = setInterval(() => {
      setSubscriptions((prev) =>
        prev.map((s) => {
          if (s.seconds_left == null) return s;
          const nextSeconds = Math.max(0, s.seconds_left - 1);
          return {
            ...s,
            seconds_left: nextSeconds,
            is_active: nextSeconds > 0,
          };
        })
      );
    }, 1000);

    return () => {
      mounted = false;
      clearInterval(intervalRef.current);
    };
  }, []);

  if (loading)
    return (
      <div className={styles.center}>
        <div className={styles.loaderContainer}>
          <div className={styles.loader} aria-hidden="true"></div>
          <div className={styles.loadingText}>Loading your subscriptions...</div>
          <div className={styles.loadingSubtext}>Getting everything ready for you</div>
        </div>
      </div>
    );

  if (error)
    return (
      <div className={styles.center}>
        <div className={styles.errorContainer}>
          <i className="fas fa-exclamation-circle"></i>
          <div className={styles.errorText}>Unable to load subscriptions</div>
          <div className={styles.errorDescription}>{error}</div>
          <button className={styles.retryButton} onClick={() => window.location.reload()}>
            <i className="fas fa-sync-alt"></i> Try Again
          </button>
        </div>
      </div>
    );

  if (!subscriptions.length)
    return (
      <div className={styles.center}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <i className="fas fa-rocket"></i>
          </div>
          <div className={styles.emptyText}>No subscriptions yet</div>
          <p className={styles.emptySubtext}>Start your learning journey with our premium plans</p>
          <button className={styles.ctaButton}>
            <i className="fas fa-gem"></i> Explore Plans
          </button>
        </div>
      </div>
    );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <p className={styles.subtitle}>Track and manage your educational subscriptions</p>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <i className="fas fa-play-circle"></i>
              <span>{subscriptions.filter(s => s.is_active).length} Active</span>
            </div>
            <div className={styles.stat}>
              <i className="fas fa-clock"></i>
              <span>{subscriptions.filter(s => !s.is_active).length} Expired</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className={styles.grid}>
        {subscriptions.map((s) => {
          const plan = s.plan || {};
          const expired = !s.is_active;
          return (
            <article
              key={s.id}
              className={`${styles.card} ${expired ? styles.expired : styles.active}`}
              aria-live="polite"
              data-subscription-id={s.id}
            >
              <div className={styles.cardGlow}></div>
              
              <div className={styles.cardHeader}>
                <div className={styles.badge}>
                  <i className={`fas ${expired ? 'fa-clock' : 'fa-bolt'}`}></i>
                  {expired ? "Expired" : "Active"}
                </div>
                <div className={styles.planIcon}>
                  <i className="fas fa-graduation-cap"></i>
                </div>
              </div>

              <div className={styles.cardBody}>
                <h3 className={styles.planTitle}>{plan.title}</h3>
                <div className={styles.planMeta}>
                  <span className={styles.exam}>
                    <i className="fas fa-book-open"></i> {plan.exam_display}
                  </span>
                  <span className={styles.duration}>
                    <i className="fas fa-calendar-alt"></i> {plan.duration_days} days access
                  </span>
                </div>

                <div className={styles.priceContainer}>
                  <div className={styles.price}>
                    <i className="fas fa-tag"></i>
                    <span className={styles.priceAmount}>
                      {plan.currency} {plan.price}
                    </span>
                  </div>
                </div>

                <div className={styles.dates}>
                  <div className={styles.dateItem}>
                    <i className="fas fa-play-circle"></i>
                    <div>
                      <div className={styles.dateLabel}>Start Date</div>
                      <div className={styles.dateValue}>{formatLocal(s.start_date)}</div>
                    </div>
                  </div>
                  <div className={styles.dateItem}>
                    <i className="fas fa-flag-checkered"></i>
                    <div>
                      <div className={styles.dateLabel}>End Date</div>
                      <div className={styles.dateValue}>{formatLocal(s.finish_date)}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.cardFooter}>
                {!expired ? (
                  <div className={styles.timer}>
                    <div className={styles.timerIcon}>
                      <i className="fas fa-hourglass-half"></i>
                    </div>
                    <div className={styles.timeContent}>
                      <div className={styles.timeRemaining}>{formatRemaining(s.seconds_left)}</div>
                      <div className={styles.timeLabel}>Time Remaining</div>
                    </div>
                    <div className={styles.progressBar}>
                      <div 
                        className={styles.progressFill} 
                        style={{ 
                          width: `${Math.max(5, (s.seconds_left / (plan.duration_days * 86400)) * 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                ) : (
                  <div className={styles.expiredState}>
                    <i className="fas fa-clock"></i>
                    <div>
                      <div className={styles.expiredText}>Subscription Ended</div>
                      <div className={styles.renewText}>Renew to continue learning</div>
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.cardHover}>
                <i className="fas fa-arrow-right"></i>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}