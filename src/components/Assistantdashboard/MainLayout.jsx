// frontend/src/features/Assistantdashboard/MainLayout.jsx
'use client'
import React, { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import DashboardPage from './Dashboard/DashboardPage'

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

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

      <main className={`admin-main ${sidebarOpen ? 'mobile-open' : ''}`}>
        <Navbar onToggle={() => setSidebarOpen((s) => !s)} />
        <DashboardPage/>
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
