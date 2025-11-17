"use client";

import { useEffect, useRef, useState } from "react";
import styles from "../../styles/Navbar.module.css";
import Image from "next/image";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const closeBtnRef = useRef(null);
  const firstMenuItemRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    // lock body scroll while menu is open
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
      // focus the close button inside the panel for keyboard users
      setTimeout(() => {
        closeBtnRef.current?.focus();
      }, 0);
    } else {
      document.body.style.overflow = "";
    }

    const onKey = (e) => {
      if (e.key === "Escape" && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleMenu = () => setIsMenuOpen((v) => !v);
  const closeMenu = () => setIsMenuOpen(false);

  const toggleDropdown = (dropdown) => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  const closeDropdown = () => setActiveDropdown(null);

  // Dropdown data
  const dropdownItems = {
    nclex: [
      { name: "NCLEX-RN", href: "/rushhour/nclex-rn" },
      { name: "NCLEX-PN", href: "/rushhour/nclex-pn" }
    ],
    nursingtestbank: [
      { name: "RN - Nursingtestbank", href: "/rushhour/rn-nursingtestbank" },
      { name: "LPN - Nursingtestbank", href: "/rushhour/lpn-nursingtestbank" }
    ]
  };

  return (
    <>
      <nav className={`${styles.navbar} ${isScrolled ? styles.scrolled : ""}`}>
        <div className={styles.navContainer}>
          {/* Logo */}
          <div className={styles.logo}>
            <Image
              src="/bv.png"
              alt="Rushhourcamp Logo"
              width={50}
              height={50}
              className={styles.logoImage}
            />
            <span className={styles.logoText}>Rushhourcamp</span>
          </div>

          {/* Desktop Navigation Links */}
          <div className={styles.navButtons} aria-hidden={isMenuOpen} ref={dropdownRef}>
            {/* Home Link as Button */}
            <a href="/" className={`${styles.navButton} ${styles.navLinkButton}`}>
              Home
            </a>

            {/* Ati Teas Link as Button */}
            <a href="/rushhour/atiteas7" className={`${styles.navButton} ${styles.navLinkButton}`}>
              Ati Teas
            </a>

            {/* NCLEX Link with Dropdown */}
            <div className={styles.dropdownContainer}>
              <button 
                className={`${styles.navButton} ${styles.navLinkButton} ${styles.dropdownToggle}`}
                onClick={() => toggleDropdown('nclex')}
                onMouseEnter={() => setActiveDropdown('nclex')}
              >
                NCLEX
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                </svg>
              </button>
              {activeDropdown === 'nclex' && (
                <div 
                  className={styles.dropdownMenu}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  {dropdownItems.nclex.map((item, index) => (
                    <a key={index} href={item.href} className={styles.dropdownItem}>
                      {item.name}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Hesia2 Link as Button */}
            <a href="/rushhour/hesia2" className={`${styles.navButton} ${styles.navLinkButton}`}>
              Hesia2
            </a>

            {/* Nursing Test Bank Link with Dropdown */}
            <div className={styles.dropdownContainer}>
              <button 
                className={`${styles.navButton} ${styles.navLinkButton} ${styles.dropdownToggle}`}
                onClick={() => toggleDropdown('nursingtestbank')}
                onMouseEnter={() => setActiveDropdown('nursingtestbank')}
              >
                Nursing Test Bank
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                </svg>
              </button>
              {activeDropdown === 'nursingtestbank' && (
                <div 
                  className={styles.dropdownMenu}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  {dropdownItems.nursingtestbank.map((item, index) => (
                    <a key={index} href={item.href} className={styles.dropdownItem}>
                      {item.name}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Exit Exams Link as Button */}
            <a href="/rushhour/exitexams" className={`${styles.navButton} ${styles.navLinkButton}`}>
              Exit Exams
            </a>
            
            {/* Auth Buttons */}
            <a href="/user/signin" className={`${styles.navButton} ${styles.signIn}`}>
              Sign In
            </a>
            <a href="/user/signup" className={`${styles.navButton} ${styles.signUp}`}>
              Sign Up
            </a>
          </div>

          {/* Mobile Hamburger */}
          <button
            className={`${styles.hamburger}`}
            onClick={toggleMenu}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="black"
                strokeWidth="2"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <>
                <span />
                <span />
                <span />
              </>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className={`${styles.mobileMenu} ${isMenuOpen ? styles.active : ""}`}
        onClick={closeMenu}
        role="presentation"
      >
        <div
          className={styles.mobileMenuContent}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label="Main menu"
        >
          {/* Close Button */}
          <button
            className={styles.closeButton}
            onClick={closeMenu}
            aria-label="Close menu"
            ref={closeBtnRef}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          {/* Mobile Menu Links */}
          <div className={styles.mobileNavButtons}>
            {/* Regular Links */}
            <a href="/" className={styles.mobileNavButton} onClick={closeMenu}>
              Home
            </a>
            <a href="/rushhour/atiteas7" className={styles.mobileNavButton} onClick={closeMenu}>
              Ati Teas
            </a>

            {/* NCLEX Mobile Dropdown */}
            <div className={styles.mobileDropdown}>
              <button 
                className={`${styles.mobileNavButton} ${styles.mobileDropdownToggle}`}
                onClick={() => toggleDropdown('mobileNclex')}
              >
                NCLEX
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                </svg>
              </button>
              {activeDropdown === 'mobileNclex' && (
                <div className={styles.mobileDropdownContent}>
                  {dropdownItems.nclex.map((item, index) => (
                    <a key={index} href={item.href} className={styles.mobileDropdownItem} onClick={closeMenu}>
                      {item.name}
                    </a>
                  ))}
                </div>
              )}
            </div>

            <a href="/rushhour/hesia2" className={styles.mobileNavButton} onClick={closeMenu}>
              Hesia2
            </a>

            {/* Nursing Test Bank Mobile Dropdown */}
            <div className={styles.mobileDropdown}>
              <button 
                className={`${styles.mobileNavButton} ${styles.mobileDropdownToggle}`}
                onClick={() => toggleDropdown('mobileTestBank')}
              >
                Nursing Test Bank
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                </svg>
              </button>
              {activeDropdown === 'mobileTestBank' && (
                <div className={styles.mobileDropdownContent}>
                  {dropdownItems.nursingtestbank.map((item, index) => (
                    <a key={index} href={item.href} className={styles.mobileDropdownItem} onClick={closeMenu}>
                      {item.name}
                    </a>
                  ))}
                </div>
              )}
            </div>

            <a href="/rushhour/exitexams" className={styles.mobileNavButton} onClick={closeMenu}>
              Exit Exams
            </a>

            {/* Auth Buttons */}
            <a href="/user/signin" className={`${styles.mobileNavButton} ${styles.mobileSignIn}`} onClick={closeMenu}>
              Sign In
            </a>
            <a href="/user/signup" className={`${styles.mobileNavButton} ${styles.mobileSignUp}`} onClick={closeMenu}>
              Sign Up
            </a>
          </div>
        </div>
      </div>
    </>
  );
}