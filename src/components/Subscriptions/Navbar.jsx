// frontend/src/features/Userdashboard/Navbar.jsx
'use client'
import React from 'react'
import Image from 'next/image'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars } from '@fortawesome/free-solid-svg-icons'

export default function Navbar({ onToggle }) {
  return (
    <header className="user-navbar">
      <div className="navbar-inner">
        <div className="brand">
          <Image src="/bv.png" alt="brand" width={36} height={36} priority />
          <span className="brand-text">Subscriptions</span>
        </div>

        <button
          className="hamburger"
          aria-label="Toggle sidebar"
          onClick={onToggle}
        >
          <FontAwesomeIcon icon={faBars} size="lg" />
        </button>
      </div>
    </header>
  )
}
