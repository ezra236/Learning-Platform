'use client';

import AuthGate from "../../signin/AuthGate";
import Sidebar from '@/components/Userdashboard/ATI/ExamDashboard/Sidebar';
import RightSection from '@/components/Userdashboard/ATI/ExamDashboard/RightSection';
import Ai from "@/components/Ai"
import Whatsapp from "@/components/Whatsapp"
import FloatingMascot from "@/components/FloatingMascot/FloatingMascot";
import MarketingQueue from "@/components/Rendered/MarketingQueue";
import styles from '@/styles/pagedashboard.module.css';
import { useState, useEffect } from 'react';

export default function Page() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleOverlayClick = () => {
    setIsMobileOpen(false);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <AuthGate>
      <div className={styles.dashboardContainer}>
        {/* Mobile Menu Toggle */}
        <button 
          className={styles.mobileMenuToggle}
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          aria-label="Toggle menu"
        >
          {isMobileOpen ? '✕' : '☰'}
        </button>

        {/* Mobile Overlay */}
        <div 
          className={`${styles.mobileOverlay} ${isMobileOpen ? styles.mobileOpen : ''}`}
          onClick={handleOverlayClick}
        />

        {/* Sidebar */}
        <div className={`${styles.sidebarWrapper} ${isMobileOpen ? styles.mobileOpen : ''}`}>
          <Sidebar onMobileLinkClick={() => setIsMobileOpen(false)} />
        </div>

        {/* Main Content */}
        <div className={styles.contentWrapper}>
          <RightSection />
        </div>
      </div>

      {/* Global page components */}
      <Ai />
      <Whatsapp />
      <FloatingMascot />
      <MarketingQueue />
    </AuthGate>
  )
}