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
  const mobileDropdownRef = useRef(null);

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
        setActiveDropdown(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  // Close dropdown when clicking outside - Desktop + Mobile-safe
  useEffect(() => {
    const handleClickOutside = (event) => {
      const target = event.target;

      // If click is inside the desktop nav (dropdownRef), do nothing
      if (dropdownRef.current && dropdownRef.current.contains(target)) {
        return;
      }

      // If click is inside the mobile menu content, do nothing (prevents immediate close on mobile)
      if (mobileDropdownRef.current && mobileDropdownRef.current.contains(target)) {
        return;
      }

      // Otherwise close any open dropdown
      setActiveDropdown(null);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  const toggleMenu = () => {
    setIsMenuOpen((v) => !v);
    setActiveDropdown(null); // Reset dropdowns when menu opens/closes
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    setActiveDropdown(null);
  };

  const toggleDropdown = (dropdown) => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  const closeDropdown = () => setActiveDropdown(null);

  // Dropdown data
  const dropdownItems = {
    nclex: [
      { name: "NCLEX-RN", href: "/rushhour/nclex-rn" },
      { name: "NCLEX-PN", href: "/rushhour/nclex-pn" },
      { name: "Buy Pdf", href: "/rushhour/pdf" }
    ],
    nursingtestbank: [
      { name: "RN - Nursingtestbank", href: "/rushhour/rn-nursingtestbank" },
      { name: "LPN - Nursingtestbank", href: "/rushhour/lpn-nursingtestbank" },
      { name: "Buy Pdf", href: "/rushhour/pdf" }
    ],
    atiteas: [
      { name: "Ati Teas", href: "/rushhour/atiteas7" },
      { name: "Buy Pdf", href: "/rushhour/pdf" }
    ],
    hesia2: [
      { name: "Hesi A2", href: "/rushhour/hesia2" },
      { name: "Buy Pdf", href: "/rushhour/pdf" }
    ],
    exitexams: [
      { name: "Exit Exams", href: "/rushhour/exitexams" },
      { name: "Buy Pdf", href: "/rushhour/pdf" }
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

            {/* Ati Teas Link with Dropdown */}
            <div className={styles.dropdownContainer}>
              <button 
                className={`${styles.navButton} ${styles.navLinkButton} ${styles.dropdownToggle}`}
                onClick={() => toggleDropdown('atiteas')}
                onMouseEnter={() => setActiveDropdown('atiteas')}
              >
                Ati Teas
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                </svg>
              </button>
              {activeDropdown === 'atiteas' && (
                <div 
                  className={styles.dropdownMenu}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  {dropdownItems.atiteas.map((item, index) => (
                    <a key={index} href={item.href} className={styles.dropdownItem}>
                      {item.name}
                    </a>
                  ))}
                </div>
              )}
            </div>

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

            {/* Hesia2 Link with Dropdown */}
            <div className={styles.dropdownContainer}>
              <button 
                className={`${styles.navButton} ${styles.navLinkButton} ${styles.dropdownToggle}`}
                onClick={() => toggleDropdown('hesia2')}
                onMouseEnter={() => setActiveDropdown('hesia2')}
              >
                Hesia2
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                </svg>
              </button>
              {activeDropdown === 'hesia2' && (
                <div 
                  className={styles.dropdownMenu}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  {dropdownItems.hesia2.map((item, index) => (
                    <a key={index} href={item.href} className={styles.dropdownItem}>
                      {item.name}
                    </a>
                  ))}
                </div>
              )}
            </div>

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

            {/* Exit Exams Link with Dropdown */}
            <div className={styles.dropdownContainer}>
              <button 
                className={`${styles.navButton} ${styles.navLinkButton} ${styles.dropdownToggle}`}
                onClick={() => toggleDropdown('exitexams')}
                onMouseEnter={() => setActiveDropdown('exitexams')}
              >
                Exit Exams
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                </svg>
              </button>
              {activeDropdown === 'exitexams' && (
                <div 
                  className={styles.dropdownMenu}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  {dropdownItems.exitexams.map((item, index) => (
                    <a key={index} href={item.href} className={styles.dropdownItem}>
                      {item.name}
                    </a>
                  ))}
                </div>
              )}
            </div>
            
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
          ref={mobileDropdownRef}
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

            {/* Ati Teas Mobile Dropdown */}
            <div className={styles.mobileDropdown}>
              <button 
                className={`${styles.mobileNavButton} ${styles.mobileDropdownToggle}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleDropdown('mobileAtiTeas');
                }}
              >
                Ati Teas
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                </svg>
              </button>
              {activeDropdown === 'mobileAtiTeas' && (
                <div className={styles.mobileDropdownContent}>
                  {dropdownItems.atiteas.map((item, index) => (
                    <a 
                      key={index} 
                      href={item.href} 
                      className={styles.mobileDropdownItem} 
                      onClick={(e) => {
                        e.stopPropagation();
                        closeMenu();
                      }}
                    >
                      {item.name}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* NCLEX Mobile Dropdown */}
            <div className={styles.mobileDropdown}>
              <button 
                className={`${styles.mobileNavButton} ${styles.mobileDropdownToggle}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleDropdown('mobileNclex');
                }}
              >
                NCLEX
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                </svg>
              </button>
              {activeDropdown === 'mobileNclex' && (
                <div className={styles.mobileDropdownContent}>
                  {dropdownItems.nclex.map((item, index) => (
                    <a 
                      key={index} 
                      href={item.href} 
                      className={styles.mobileDropdownItem} 
                      onClick={(e) => {
                        e.stopPropagation();
                        closeMenu();
                      }}
                    >
                      {item.name}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Hesia2 Mobile Dropdown */}
            <div className={styles.mobileDropdown}>
              <button 
                className={`${styles.mobileNavButton} ${styles.mobileDropdownToggle}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleDropdown('mobileHesia2');
                }}
              >
                Hesia2
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                </svg>
              </button>
              {activeDropdown === 'mobileHesia2' && (
                <div className={styles.mobileDropdownContent}>
                  {dropdownItems.hesia2.map((item, index) => (
                    <a 
                      key={index} 
                      href={item.href} 
                      className={styles.mobileDropdownItem} 
                      onClick={(e) => {
                        e.stopPropagation();
                        closeMenu();
                      }}
                    >
                      {item.name}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Nursing Test Bank Mobile Dropdown */}
            <div className={styles.mobileDropdown}>
              <button 
                className={`${styles.mobileNavButton} ${styles.mobileDropdownToggle}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleDropdown('mobileTestBank');
                }}
              >
                Nursing Test Bank
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                </svg>
              </button>
              {activeDropdown === 'mobileTestBank' && (
                <div className={styles.mobileDropdownContent}>
                  {dropdownItems.nursingtestbank.map((item, index) => (
                    <a 
                      key={index} 
                      href={item.href} 
                      className={styles.mobileDropdownItem} 
                      onClick={(e) => {
                        e.stopPropagation();
                        closeMenu();
                      }}
                    >
                      {item.name}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Exit Exams Mobile Dropdown */}
            <div className={styles.mobileDropdown}>
              <button 
                className={`${styles.mobileNavButton} ${styles.mobileDropdownToggle}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleDropdown('mobileExitExams');
                }}
              >
                Exit Exams
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                </svg>
              </button>
              {activeDropdown === 'mobileExitExams' && (
                <div className={styles.mobileDropdownContent}>
                  {dropdownItems.exitexams.map((item, index) => (
                    <a 
                      key={index} 
                      href={item.href} 
                      className={styles.mobileDropdownItem} 
                      onClick={(e) => {
                        e.stopPropagation();
                        closeMenu();
                      }}
                    >
                      {item.name}
                    </a>
                  ))}
                </div>
              )}
            </div>

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
