'use client';

import React, { useEffect, useState } from 'react';
import styles from './Sidebar.module.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export default function Sidebar({ onMobileLinkClick }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [totals, setTotals] = useState(null);
  const [error, setError] = useState(null);
  const [activeLink, setActiveLink] = useState('');
  const pathname = usePathname();

  useEffect(() => {
    let mounted = true;
    async function fetchDashboard() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/api/user/ati-dashboard/`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json'
          }
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`API Error (${res.status}): ${text}`);
        }
        const data = await res.json();
        if (!mounted) return;
        setUser(data.user || {});
        setTotals(data.totals || {});
      } catch (err) {
        console.error(err);
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchDashboard();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (pathname) {
      if (pathname.includes('/plans')) setActiveLink('plans');
      else if (pathname.includes('/subscriptions')) setActiveLink('subscriptions');
      else if (pathname.includes('/progress')) setActiveLink('progress');
      else if (pathname.includes('/profile')) setActiveLink('profile');
      else setActiveLink('');
    }
  }, [pathname]);

  const displayName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email : '';
  const userInitial = displayName ? displayName.charAt(0).toUpperCase() : 'U';

  const handleLinkClick = () => {
    if (onMobileLinkClick) {
      onMobileLinkClick();
    }
  };

  const navItems = [
    { href: "/user/plans/", icon: "🎯", label: "Explore Plans", key: "plans" },
    { href: "/user/subscriptions/", icon: "📅", label: "Subscriptions", key: "subscriptions" },
    { href: "/user/progress/", icon: "📈", label: "Progress", key: "progress" },
    { href: "/user/profile/", icon: "👤", label: "Profile", key: "profile" }
  ];

  return (
    <aside className={styles.sidebar}>
      {/* Header with Logo */}
      <div className={styles.header}>
        <div className={styles.logo}>
          <div className={styles.logoIconContainer}>
            <span className={styles.logoIcon}>🚀</span>
          </div>
          <div className={styles.logoText}>
            <span className={styles.logoPrimary}>RushHour</span>
            <span className={styles.logoSecondary}>Camp</span>
          </div>
        </div>
        <div className={styles.badge}>Beta</div>
      </div>

      {/* User Profile Section */}
      <div className={styles.profileSection}>
        <div className={styles.avatarContainer}>
          <div className={styles.avatar}>
            {user?.profile_picture ? (
              <img 
                src={user.profile_picture} 
                alt={displayName}
                className={styles.avatarImage}
              />
            ) : (
              <span className={styles.avatarFallback}>{userInitial}</span>
            )}
          </div>
          <div className={styles.onlineIndicator}></div>
        </div>
        
        {loading ? (
          <div className={styles.skeleton}>
            <div className={styles.skeletonLine}></div>
            <div className={styles.skeletonSubline}></div>
          </div>
        ) : error ? (
          <div className={styles.error}>
            <span className={styles.errorIcon}>⚠️</span>
            Error loading profile
          </div>
        ) : (
          <div className={styles.userInfo}>
            <h2 className={styles.username}>{displayName}</h2>
            <div className={styles.userStats}>
              <div className={styles.statItem}>
                <span className={styles.statIcon}>📊</span>
                <span className={styles.statText}>
                  {totals?.total_exams_completed ?? 0} completed
                </span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statIcon}>⭐</span>
                <span className={styles.statText}>
                  {totals?.total_exams_attempted ?? 0} in progress
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Section */}
      <nav className={styles.navigation}>
        <div className={styles.navHeader}>
          <span className={styles.navIcon}>🧭</span>
          <span className={styles.navTitle}>Quick Navigation</span>
        </div>
        
        <div className={styles.navLinks}>
          {navItems.map((item) => (
            <Link 
              key={item.key}
              href={item.href} 
              className={`${styles.navLink} ${activeLink === item.key ? styles.navLinkActive : ''}`}
              onClick={handleLinkClick}
            >
              <span className={styles.linkIcon}>{item.icon}</span>
              <span className={styles.linkText}>{item.label}</span>
              <span className={styles.linkArrow}>›</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Progress Section */}
      <div className={styles.progressSection}>
        <div className={styles.progressHeader}>
          <span className={styles.progressIcon}>📈</span>
          <span className={styles.progressTitle}>Overall Progress</span>
        </div>
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill} 
            style={{ width: `${totals?.progress_percentage || 0}%` }}
          ></div>
        </div>
        <div className={styles.progressText}>
          <span>{totals?.progress_percentage || 0}% Complete</span>
          <span>{totals?.total_exams_completed || 0}/{totals?.total_exams || 0} Exams</span>
        </div>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerIcon}>🌟</div>
          <div className={styles.footerText}>
            <div className={styles.footerQuote}>"Knowledge is power"</div>
            <div className={styles.footerSubtext}>Keep pushing forward!</div>
          </div>
        </div>
        <div className={styles.footerCopyright}>
          © 2024 RushHourCamp. All rights reserved.
        </div>
      </div>
    </aside>
  );
}