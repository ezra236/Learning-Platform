// components/insights/Announcement.jsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import styles from "./Announcement.module.css";
import Modal from "./Modal";

export default function Announcement({ announcement }) {
  const [open, setOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const videoRef = useRef(null);

  const isVideo = announcement.format === "video";
  const src = announcement.mediapath;

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

  const getEngagementLevel = (views) => {
    if (views > 500) return "high";
    if (views > 200) return "medium";
    return "low";
  };

  const engagementLevel = getEngagementLevel(announcement.views_count || 0);

  return (
    <>
      <div 
        className={styles.card}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className={styles.cardHeader}>
          <div className={styles.engagementBadge} data-level={engagementLevel}>
            {engagementLevel === "high" ? "🔥" : engagementLevel === "medium" ? "⚡" : "📢"}
            {engagementLevel.toUpperCase()}
          </div>
          {announcement.is_active && (
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
              <div className={styles.videoBadge}>🎥</div>
            </div>
          ) : (
            <div className={styles.imageWrapper}>
              <img 
                className={`${styles.media} ${imageLoaded ? styles.loaded : ''}`} 
                src={src} 
                alt="announcement media"
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
              <span className={styles.viewText}>🎯 VIEW</span>
              <span className={styles.hint}>Click to expand</span>
            </div>
          </div>
        </div>

        <div className={styles.cardBody}>
          <div className={styles.metrics}>
            <div className={styles.metric}>
              <span className={styles.metricIcon}>🎯</span>
              <div className={styles.metricContent}>
                <div className={styles.metricValue}>{announcement.views_count || 0}</div>
                <div className={styles.metricLabel}>Views</div>
              </div>
            </div>
            
            <div className={styles.metric}>
              <span className={styles.metricIcon}>📊</span>
              <div className={styles.metricContent}>
                <div className={styles.metricValue}>{engagementLevel}</div>
                <div className={styles.metricLabel}>Engagement</div>
              </div>
            </div>
          </div>

          {announcement.created_at && (
            <div className={styles.date}>
              <span className={styles.dateIcon}>📅</span>
              {new Date(announcement.created_at).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
          )}
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
                alt="announcement" 
              />
            )}
            
            <div className={styles.modalDetails}>
              <div className={styles.modalHeader}>
                <h3>Announcement</h3>
                <div className={styles.modalBadges}>
                  {announcement.is_active && (
                    <span className={styles.modalActiveBadge}>🟢 Active</span>
                  )}
                  <span className={styles.modalEngagementBadge} data-level={engagementLevel}>
                    {engagementLevel.toUpperCase()} ENGAGEMENT
                  </span>
                </div>
              </div>
              
              <div className={styles.modalStats}>
                <div className={styles.modalStat}>
                  <div className={styles.modalStatIcon}>🎯</div>
                  <div>
                    <div className={styles.modalStatValue}>{announcement.views_count || 0}</div>
                    <div className={styles.modalStatLabel}>Total Views</div>
                  </div>
                </div>
                
                {announcement.created_at && (
                  <div className={styles.modalStat}>
                    <div className={styles.modalStatIcon}>📅</div>
                    <div>
                      <div className={styles.modalStatValue}>
                        {new Date(announcement.created_at).toLocaleDateString()}
                      </div>
                      <div className={styles.modalStatLabel}>Published</div>
                    </div>
                  </div>
                )}
                
                <div className={styles.modalStat}>
                  <div className={styles.modalStatIcon}>🎯</div>
                  <div>
                    <div className={styles.modalStatValue}>
                      {announcement.is_active ? "Active" : "Inactive"}
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