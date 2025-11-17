'use client'
import React, { useState } from 'react'
import AnnouncementsPanel from './AnnouncementsPanel'
import Image from './Image'
import Video from './Video'
import styles from './AnnouncementLayout.module.css'

export default function AnnouncementLayout() {
  const [activeTab, setActiveTab] = useState('image')
  const [showUpload, setShowUpload] = useState(false)

  return (
    <div className={styles.container}>
      <div className={styles.background}>
        <div className={styles.gradientBackground}></div>
        <div className={styles.floatingElements}>
          <div className={styles.floatingShape}></div>
          <div className={styles.floatingShape}></div>
          <div className={styles.floatingShape}></div>
        </div>
      </div>
      
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.badge}>Media Management</div>
            <h1 className={styles.title}>
              Announcement Center
            </h1>
            <p className={styles.subtitle}>
              Create and manage beautiful media announcements for your platform
            </p>
            
            {!showUpload && (
              <button 
                className={styles.createButton}
                onClick={() => setShowUpload(true)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
                Create New Announcement
              </button>
            )}
          </div>
        </div>

        {showUpload && (
          <div className={styles.uploadSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Create Announcement</h2>
              <button 
                className={styles.closeButton}
                onClick={() => setShowUpload(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>

            <div className={styles.navigation}>
              <div className={styles.tabContainer}>
                <button
                  className={`${styles.tab} ${activeTab === 'image' ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab('image')}
                >
                  <div className={styles.tabIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3Z" stroke="currentColor" strokeWidth="2"/>
                      <path d="M8.5 10C9.32843 10 10 9.32843 10 8.5C10 7.67157 9.32843 7 8.5 7C7.67157 7 7 7.67157 7 8.5C7 9.32843 7.67157 10 8.5 10Z" stroke="currentColor" strokeWidth="2"/>
                      <path d="M21 15L16 10L5 21" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div className={styles.tabContent}>
                    <span className={styles.tabTitle}>Image</span>
                    <span className={styles.tabDescription}>1:1 Square Ratio</span>
                  </div>
                </button>
                
                <button
                  className={`${styles.tab} ${activeTab === 'video' ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab('video')}
                >
                  <div className={styles.tabIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M14.75 12L9.75 9V15L14.75 12Z" stroke="currentColor" strokeWidth="2"/>
                      <path d="M21 5H3C1.89543 5 1 5.89543 1 7V17C1 18.1046 1.89543 19 3 19H21C22.1046 19 23 18.1046 23 17V7C23 5.89543 22.1046 5 21 5Z" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div className={styles.tabContent}>
                    <span className={styles.tabTitle}>Video</span>
                    <span className={styles.tabDescription}>9:16 Vertical Ratio</span>
                  </div>
                </button>
              </div>
            </div>

            <div className={styles.mediaSection}>
              {activeTab === 'image' ? <Image onUploadComplete={() => setShowUpload(false)} /> : <Video onUploadComplete={() => setShowUpload(false)} />}
            </div>
          </div>
        )}

        <AnnouncementsPanel />

        <div className={styles.footer}>
          <div className={styles.footerContent}>
            <div className={styles.tip}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
              </svg>
              <span>Use high-quality media for optimal display results</span>
            </div>
            <div className={styles.features}>
              <div className={styles.feature}>
                <div className={styles.featureIcon}>✓</div>
                Easy Upload
              </div>
              <div className={styles.feature}>
                <div className={styles.featureIcon}>⚡</div>
                Fast Preview
              </div>
              <div className={styles.feature}>
                <div className={styles.featureIcon}>📱</div>
                Mobile Optimized
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}