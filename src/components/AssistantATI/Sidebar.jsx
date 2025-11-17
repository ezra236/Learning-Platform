// frontend/src/features/Admindashboard/Sidebar.jsx
'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUserFriends,
  faChartBar,
  faClipboardList,
  faTachometerAlt,
  faTags,
  faComments,
  faTimes,
  faStarHalfAlt,
  faCreditCard,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons'

const links = [
  { href: '/assistant/dashboard', label: 'Dashboard', icon: faTachometerAlt },
  { href: '/assistant/exams/create/ati', label: 'Ati teas7', icon: faClipboardList },
  { href: '/assistant/exams/create/hesi', label: 'HESI A2', icon: faClipboardList },
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
      // Reset loading state after navigation
      setTimeout(() => setLoadingLink(null), 1000)
    }, 300)
  }

  return (
    <aside
      className={`admin-sidebar ${isOpen ? 'open' : ''}`}
      aria-hidden={!isOpen && typeof window !== 'undefined' && window.innerWidth < 769}
    >
      <div className="sidebar-inner">
        {/* Close button only visible on small screens */}
        <button className="close-x" aria-label="Close sidebar" onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>

        <div className="sidebar-logo">
          <img src="/bv.png" alt="logo" />
          <h2>Rushhourcamp</h2>
        </div>

        <nav className="sidebar-nav" aria-label="Admin navigation">
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