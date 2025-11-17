// components/insights/Campaign.jsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import styles from "./Campaign.module.css";
import Modal from "./Modal";

export default function Campaign({ campaign }) {
  const [open, setOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const videoRef = useRef(null);

  const isVideo = campaign.format === "video" || campaign.cloud_resource_type === "video";
  const src = campaign.mediapath;

  useEffect(() => {
    if (isVideo && videoRef.current && isHovered) {
      videoRef.current.play().catch(() => {});
    } else if (isVideo && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isHovered, isVideo]);

  const handleVideoProgress = (event) => {
    const video = event.target;
    const progress = (video.currentTime / video.duration) * 100;
    setVideoProgress(progress || 0);
  };

  const getPerformanceColor = (views) => {
    if (views > 1000) return "#10b981"; // Emerald
    if (views > 500) return "#f59e0b"; // Amber
    return "#ef4444"; // Red
  };

  const performanceLevel = campaign.views_count > 1000 ? "high" : 
                          campaign.views_count > 500 ? "medium" : "low";

  return (
    <>
      <div 
        className={styles.card}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className={styles.cardHeader}>
          <div className={styles.performanceBadge} data-level={performanceLevel}>
            {performanceLevel === "high" ? "🔥" : performanceLevel === "medium" ? "⚡" : "💤"}
            {performanceLevel.toUpperCase()}
          </div>
          {campaign.is_active && (
            <div className={styles.activeBadge}>
              <span className={styles.pulse}></span>
              🟢 LIVE
            </div>
          )}
        </div>

        <div 
          className={styles.mediaContainer} 
          onClick={() => setOpen(true)} 
          role="button" 
          tabIndex={0}
        >
          {isVideo ? (
            <div className={styles.videoWrapper}>
              <video 
                ref={videoRef}
                className={styles.media}
                src={src}
                muted
                playsInline
                onTimeUpdate={handleVideoProgress}
              />
              <div className={styles.videoOverlay}>
                <div className={styles.playButton}>▶</div>
                <div className={styles.videoProgress}>
                  <div 
                    className={styles.progressBar} 
                    style={{ width: `${videoProgress}%` }}
                  />
                </div>
              </div>
              <div className={styles.videoBadge}>🎥 VIDEO</div>
            </div>
          ) : (
            <div className={styles.imageWrapper}>
              <img 
                className={`${styles.media} ${imageLoaded ? styles.loaded : ''}`} 
                src={src} 
                alt={campaign.heading || "campaign media"}
                onLoad={() => setImageLoaded(true)}
              />
              {!imageLoaded && (
                <div className={styles.mediaSkeleton}>
                  <div className={styles.skeletonIcon}>📷</div>
                </div>
              )}
            </div>
          )}
          
          <div className={`${styles.overlay} ${isHovered ? styles.visible : ''}`}>
            <div className={styles.overlayContent}>
              <span className={styles.viewText}>🎯 VIEW DETAILS</span>
              <span className={styles.hint}>Click to expand</span>
            </div>
          </div>
        </div>

        <div className={styles.cardBody}>
          <h3 className={styles.title}>{campaign.heading}</h3>
          <p className={styles.description}>{campaign.description}</p>
          
          <div className={styles.metrics}>
            <div className={styles.metric}>
              <span className={styles.metricIcon}>🎯</span>
              <div className={styles.metricContent}>
                <div className={styles.metricValue}>{campaign.views_count || 0}</div>
                <div className={styles.metricLabel}>Views</div>
              </div>
            </div>
            
            <div className={styles.metric}>
              <span className={styles.metricIcon}>📊</span>
              <div className={styles.metricContent}>
                <div 
                  className={styles.metricValue}
                  style={{ color: getPerformanceColor(campaign.views_count || 0) }}
                >
                  {performanceLevel}
                </div>
                <div className={styles.metricLabel}>Performance</div>
              </div>
            </div>
            
            <div className={styles.metric}>
              <span className={styles.metricIcon}>📅</span>
              <div className={styles.metricContent}>
                <div className={styles.metricValue}>
                  {new Date(campaign.created_at || Date.now()).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </div>
                <div className={styles.metricLabel}>Created</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {open && (
        <Modal onClose={() => setOpen(false)}>
          <div className={styles.modalContent}>
            {isVideo ? (
              <video 
                controls 
                autoPlay 
                className={styles.modalMedia} 
                src={src} 
              />
            ) : (
              <img 
                className={styles.modalMedia} 
                src={src} 
                alt={campaign.heading || "campaign"} 
              />
            )}
            
            <div className={styles.modalDetails}>
              <div className={styles.modalHeader}>
                <h2>{campaign.heading}</h2>
                <div className={styles.modalBadges}>
                  {campaign.is_active && (
                    <span className={styles.modalActiveBadge}>🟢 Active</span>
                  )}
                  <span 
                    className={styles.modalPerformanceBadge}
                    style={{ backgroundColor: getPerformanceColor(campaign.views_count || 0) }}
                  >
                    {performanceLevel.toUpperCase()} PERFORMANCE
                  </span>
                </div>
              </div>
              
              <p className={styles.modalDescription}>{campaign.description}</p>
              
              <div className={styles.modalStats}>
                <div className={styles.modalStat}>
                  <div className={styles.modalStatIcon}>🎯</div>
                  <div>
                    <div className={styles.modalStatValue}>{campaign.views_count || 0}</div>
                    <div className={styles.modalStatLabel}>Total Views</div>
                  </div>
                </div>
                
                <div className={styles.modalStat}>
                  <div className={styles.modalStatIcon}>📅</div>
                  <div>
                    <div className={styles.modalStatValue}>
                      {new Date(campaign.created_at || Date.now()).toLocaleDateString()}
                    </div>
                    <div className={styles.modalStatLabel}>Created Date</div>
                  </div>
                </div>
                
                <div className={styles.modalStat}>
                  <div className={styles.modalStatIcon}>🎯</div>
                  <div>
                    <div className={styles.modalStatValue}>
                      {campaign.is_active ? "Active" : "Inactive"}
                    </div>
                    <div className={styles.modalStatLabel}>Status</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}