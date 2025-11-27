// components/MarketingQueue/MarketingQueue.jsx
"use client";

import React, { useEffect, useState, useRef } from "react";
import styles from "./MarketingQueue.module.css";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

function getCsrfToken() {
  return fetch(`${API_BASE}/api/auth/csrf/`, {
    method: "GET",
    credentials: "include",
  })
    .then((r) => r.json())
    .then((j) => j.csrfToken)
    .catch(() => null);
}

export default function MarketingQueue() {
  const [queue, setQueue] = useState([]);
  const [index, setIndex] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const csrfRef = useRef(null);
  const markingRef = useRef({});

  async function fetchQueue() {
    try {
      const res = await fetch(`${API_BASE}/api/marketing/queue/`, {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });
      if (res.status === 200) {
        const data = await res.json();
        // now the backend returns only campaigns
        const camp = (data.campaigns || []).map((c) => ({ ...c, type: "campaign" }));
        const merged = [...camp];
        setQueue(merged);
        if (merged.length === 0) {
          setIndex(0);
        } else if (index >= merged.length) {
          setIndex(0);
        }
      } else if (res.status === 401) {
        setQueue([]);
      }
    } catch (err) {
      console.error("Failed to fetch marketing queue", err);
    }
  }

  async function markCampaignSeen(id) {
    if (!id || markingRef.current[`campaign:${id}`]) return;
    markingRef.current[`campaign:${id}`] = true;
    try {
      if (!csrfRef.current) csrfRef.current = await getCsrfToken();
      await fetch(`${API_BASE}/api/marketing/campaign_seen/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfRef.current || "",
        },
        body: JSON.stringify({ campaign_id: id }),
      });
    } catch (err) {
      console.error("Failed to mark campaign seen", err);
    }
  }

  useEffect(() => {
    let mounted = true;
    fetchQueue();

    const interval = setInterval(() => {
      fetchQueue();
    }, 2 * 60 * 1000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const item = queue[index];
    if (!item) return;
    // All items are campaigns now
    markCampaignSeen(item.id);
  }, [queue, index]);

  function onCloseCurrent() {
    const nextIndex = index + 1;
    if (nextIndex < queue.length) {
      setIndex(nextIndex);
    } else {
      setQueue([]);
      setIndex(0);
      markingRef.current = {};
    }
  }

  function onMinimize() {
    setIsMinimized(!isMinimized);
  }

  function onNavigate(direction) {
    if (queue.length === 0) return;
    if (direction === "next") {
      setIndex((prev) => (prev + 1) % queue.length);
    } else {
      setIndex((prev) => (prev - 1 + queue.length) % queue.length);
    }
  }

  const current = queue[index];
  if (!current) return null;

  if (isMinimized) {
    return (
      <div className={styles.minimizedContainer}>
        <button
          className={styles.expandButton}
          onClick={onMinimize}
          aria-label="Expand marketing queue"
        >
          📢 {queue.length > 1 && <span className={styles.badge}>{queue.length}</span>}
        </button>
      </div>
    );
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.card}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.icon}>📢</span>
            <div className={styles.titleSection}>
              <h3 className={styles.title}>Campaign</h3>
              {queue.length > 1 && (
                <span className={styles.counter}>
                  {index + 1} of {queue.length}
                </span>
              )}
            </div>
          </div>
          <div className={styles.headerRight}>
            {queue.length > 1 && (
              <>
                <button
                  className={styles.navButton}
                  onClick={() => onNavigate("prev")}
                  aria-label="Previous"
                >
                  ◀
                </button>
                <button
                  className={styles.navButton}
                  onClick={() => onNavigate("next")}
                  aria-label="Next"
                >
                  ▶
                </button>
              </>
            )}
            <button
              className={styles.minimizeButton}
              onClick={onMinimize}
              aria-label="Minimize"
            >
              ➖
            </button>
            <button className={styles.closeButton} onClick={onCloseCurrent} aria-label="Close">
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {/* campaign rendering (kept from original) */}
          <div className={styles.campaignContainer}>
            {(current.format === "image" || current.format === "video") && (
              <div className={styles.mediaContainer}>
                {current.format === "image" && (
                  <img
                    className={`${styles.media} ${styles.imageMedia}`}
                    src={current.mediapath}
                    alt={current.heading || "campaign"}
                  />
                )}
                {current.format === "video" && (
                  <video
                    className={`${styles.media} ${styles.videoMedia}`}
                    src={current.mediapath}
                    controls
                    autoPlay
                    muted
                  />
                )}
              </div>
            )}

            {(current.heading || current.description) && (
              <div className={styles.caption}>
                {current.heading && <h4 className={styles.heading}>{current.heading}</h4>}
                {current.description && <p className={styles.description}>{current.description}</p>}
                {current.link && (
                  <a
                    className={styles.link}
                    href={current.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    🔗 See More
                  </a>
                )}
              </div>
            )}

            {current.format === "none" && (
              <div className={styles.textCampaign}>
                {current.heading && <h3 className={styles.heading}>{current.heading}</h3>}
                {current.description && <p className={styles.description}>{current.description}</p>}
                {current.link && (
                  <a
                    className={styles.link}
                    href={current.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    🔗 Learn More
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
