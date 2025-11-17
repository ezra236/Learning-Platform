'use client'
import React, { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import Frame from './Frame'

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeExam, setActiveExam] = useState(null);

  // lock body scroll on mobile when sidebar is open
  useEffect(() => {
    if (typeof window === 'undefined') return
    document.body.style.overflow = sidebarOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [sidebarOpen])

  return (
    <div className="admin-root">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className={`admin-main ${sidebarOpen ? 'mobile-open' : ''}`} style={{ overflowX: 'auto', whiteSpace: 'nowrap', }}>
        <Frame />
      </main>

      {/* overlay only visible on small screens when sidebar is open */}
      <div
        className={`mobile-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden={!sidebarOpen}
      />
    </div>
  )
}
