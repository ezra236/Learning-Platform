// Ads.jsx
"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../../styles/ads.module.css";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

const Ads = () => {
  const router = useRouter();

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showScrollHint, setShowScrollHint] = useState(true);

  // track expanded state for each plan
  const [expandedStates, setExpandedStates] = useState([]);
  const extraRefs = useRef([]);
  const scrollContainerRef = useRef(null);
  const scrollHintTimeoutRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    // Check if mobile on mount and resize
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 765);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    async function fetchPlans() {
      try {
        // 1) hit CSRF endpoint to set cookie (useful for later POSTs)
        const csrfRes = await fetch(`${BASE}/api/csrfs/`, {
          method: "GET",
          credentials: "include",
        });

        if (!csrfRes.ok) {
          throw new Error(`Failed to fetch CSRF token (status ${csrfRes.status})`);
        }
        // we don't need the token for GETs; just ensure cookie set
        try { await csrfRes.json(); } catch (e) { /* ignore parsing errors */ }

        // 2) fetch all plans (simple GET: NO Content-Type or X-CSRFToken header)
        const plansRes = await fetch(`${BASE}/api/plan/`, {
          method: "GET",
          credentials: "include",
        });

        if (!plansRes.ok) {
          throw new Error(`Failed to fetch plans (status ${plansRes.status})`);
        }

        const plansData = await plansRes.json();

        if (mounted) {
          setPlans(plansData);
          setExpandedStates(new Array(plansData.length).fill(false));
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || "Unknown error");
          setLoading(false);
        }
      }
    }

    fetchPlans();

    return () => {
      mounted = false;
      window.removeEventListener('resize', checkMobile);
      if (scrollHintTimeoutRef.current) {
        clearTimeout(scrollHintTimeoutRef.current);
      }
    };
  }, []);

  // Hide scroll hint after user starts scrolling or after 5 seconds
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !isMobile) return;

    const handleScroll = () => {
      setShowScrollHint(false);
    };

    container.addEventListener('scroll', handleScroll);
    
    // Auto-hide after 5 seconds
    scrollHintTimeoutRef.current = setTimeout(() => {
      setShowScrollHint(false);
    }, 5000);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollHintTimeoutRef.current) {
        clearTimeout(scrollHintTimeoutRef.current);
      }
    };
  }, [isMobile]);

  const toggleExpand = (idx) => {
    setExpandedStates((prev) => {
      const copy = prev.slice();
      copy[idx] = !copy[idx];
      return copy;
    });
  };

  const handleGetStarted = (plan) => {
    router.push("/user/signup");
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      const cardWidth = scrollContainerRef.current.querySelector(`.${styles.planCard}`)?.offsetWidth || 300;
      const gap = 32; // 2rem in pixels
      scrollContainerRef.current.scrollBy({
        left: -(cardWidth + gap),
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const cardWidth = scrollContainerRef.current.querySelector(`.${styles.planCard}`)?.offsetWidth || 300;
      const gap = 32; // 2rem in pixels
      scrollContainerRef.current.scrollBy({
        left: cardWidth + gap,
        behavior: 'smooth'
      });
    }
  };

  if (loading) return (
    <section className={styles.adsSection}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>Package Pricing</h2>
        <div className={styles.loading}>Loading plans…</div>
      </div>
    </section>
  );

  if (error) return (
    <section className={styles.adsSection}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>Package Pricing</h2>
        <div className={styles.error}>Error: {error}</div>
      </div>
    </section>
  );

  return (
    <section className={styles.adsSection}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>Package Pricing</h2>
        
        <div className={styles.scrollWrapper}>
          <button 
            className={styles.scrollButton} 
            onClick={scrollLeft}
            aria-label="Scroll left"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>

          <div className={styles.plansContainer} ref={scrollContainerRef}>
            {plans.map((plan, index) => {
              const features = Array.isArray(plan.features) ? plan.features : [];
              const hasExtra = features.length > 4;
              const expanded = expandedStates[index];
              const measuredHeight =
                extraRefs.current[index]?.scrollHeight ?? (features.length - 4) * 28;

              return (
                <div key={plan.id || index} className={styles.planCard}>
                  <div className={styles.planHeader}>
                    <h3 className={styles.planTitle}>{plan.title}</h3>
                    <p className={styles.planDuration}>
                      {plan.duration_days} Days Access
                    </p>
                    <div className={styles.planPrice}>
                      {plan.currency} {plan.price}
                    </div>
                  </div>

                  <ul className={styles.featuresList}>
                    {features.slice(0, 4).map((f, i) => (
                      <li key={i} className={styles.featureItem}>
                        {typeof f === "string" ? f : f.name}
                      </li>
                    ))}

                    {hasExtra && (
                      <>
                        <div
                          id={`extra-features-${index}`}
                          className={`${styles.extraFeatures} ${expanded ? styles.expanded : ""}`}
                          style={{
                            maxHeight: expanded ? `${measuredHeight}px` : "0px",
                          }}
                          aria-hidden={!expanded}
                        >
                          <div
                            ref={(el) => (extraRefs.current[index] = el)}
                            className={styles.extraFeaturesInner}
                          >
                            {features.slice(4).map((f, j) => (
                              <li
                                key={j}
                                className={`${styles.featureItem} ${styles.extraFeatureItem}`}
                              >
                                {typeof f === "string" ? f : f.name}
                              </li>
                            ))}
                          </div>
                        </div>

                        <button
                          className={styles.toggleButton}
                          onClick={() => toggleExpand(index)}
                          aria-expanded={expanded}
                          aria-controls={`extra-features-${index}`}
                          title={expanded ? "Hide additional features" : "Show more features"}
                        >
                          <span className={styles.toggleIcon}>
                            {expanded ? "−" : "+"}
                          </span>
                          <span className={styles.toggleLabel}>
                            {expanded ? "Show less" : `${features.length - 4} more`}
                          </span>
                        </button>
                      </>
                    )}
                  </ul>

                  <button className={styles.ctaButton} onClick={() => handleGetStarted(plan)}>
                    Get Started
                  </button>
                </div>
              );
            })}
          </div>

          <button 
            className={styles.scrollButton} 
            onClick={scrollRight}
            aria-label="Scroll right"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>

        {/* Mobile Scroll Indicator */}
        {isMobile && showScrollHint && (
          <div className={styles.scrollHint}>
            <div className={styles.scrollHintContent}>
              <span className={styles.scrollHintText}>Swipe to see more</span>
              <div className={styles.scrollHintArrows}>
                <span className={styles.scrollArrow}>→</span>
                <span className={styles.scrollArrow}>→</span>
                <span className={styles.scrollArrow}>→</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Ads;