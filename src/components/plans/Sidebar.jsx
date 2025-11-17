// frontend/src/features/Userdashboard/Sidebar.jsx
'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBell,
  faTags,
  faCreditCard,
  faBookmark,
  faChartLine,
  faUser,
  faTimes,
  faTachometerAlt,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons'

const links = [
  { href: '/user/dashboard/', label: 'Dashboard', icon: faTachometerAlt },
  { href: '/user/subscriptions/', label: 'Subscriptions', icon: faCreditCard },
  { href: '/user/plans/', label: 'Plans', icon: faTags },
  { href: '/user/bookmarks/', label: 'Bookmarks', icon: faBookmark },
  { href: '/user/progress/', label: 'Progress', icon: faChartLine },
  { href: '/user/profile/', label: 'Profile', icon: faUser },
]

export default function Sidebar({ isOpen, onClose }) {
  const [loadingLink, setLoadingLink] = useState(null)
  const router = useRouter()

  const handleLinkClick = (href, e) => {
    e.preventDefault()
    setLoadingLink(href)
    onClose()
    
    // Simulate a small delay to show the loading state
    setTimeout(() => {
      router.push(href)
      // Reset loading state after navigation (you might want to handle this differently based on your app's navigation)
      setTimeout(() => setLoadingLink(null), 1000)
    }, 300)
  }

  return (
    <aside
      className={`user-sidebar ${isOpen ? 'open' : ''}`}
      aria-hidden={!isOpen && typeof window !== 'undefined' && window.innerWidth < 769}
    >
      <div className="sidebar-inner">
        <button className="close-x" aria-label="Close sidebar" onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>

        <div className="sidebar-logo">
          <img src="/bv.png" alt="logo" />
          <h2>Rushhourcamp</h2>
        </div>

        <nav className="sidebar-nav" aria-label="User navigation">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={`nav-link ${loadingLink === l.href ? 'loading' : ''}`}
              onClick={(e) => handleLinkClick(l.href, e)}
              aria-busy={loadingLink === l.href}
            >
              <FontAwesomeIcon 
                icon={loadingLink === l.href ? faSpinner : l.icon} 
                className={`nav-icon ${loadingLink === l.href ? 'spin' : ''}`}
              />
              <span className="nav-text">
                {loadingLink === l.href ? 'Loading...' : l.label}
              </span>
            </a>
          ))}
        </nav>

        <div className="sidebar-footer">
          <small>© Rushhour Camp</small>
        </div>
      </div>
    </aside>
  )
}