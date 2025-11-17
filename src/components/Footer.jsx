// components/Footer.jsx
import React, { useState } from 'react';
import styles from '../styles/footer.module.css';
import NewsletterForm from './NewsletterForm';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const Footer = ({ customLinks }) => {
  const router = useRouter();
  const [loadingLink, setLoadingLink] = useState(null);

  const handleLinkClick = (href, isExternal = false) => {
    if (isExternal) return; // Don't show loader for external links
    
    setLoadingLink(href);
    
    // Simulate a minimum loading time for better UX
    setTimeout(() => {
      setLoadingLink(null);
    }, 1000);
  };

  const companyLinks = customLinks?.company || [
    { title: 'Pricing', href: '/rushhour/pricing', icon: '🏷️' },
    { title: 'Refund Policy', href: '/rushhour/refund', icon: '🔄' },
    { title: 'Admin', href: '/admin/signup', icon: '⚙️' },
    { title: 'Assistant', href: '/assistant/signin', icon: '⚙️' },
  ];

  const resourceLinks = customLinks?.resources || [
    { title: 'ATI TEAS 7', href: '/rushhour/atiteas7', icon: '📄' },
    { title: 'NCLEX RN', href: '/rushhour/nclex-rn', icon: '🎓' },
    { title: 'NCLEX PN', href: '/rushhour/nclex-pn', icon: '🧠' },
    { title: 'HESI A2', href: '/rushhour/hesia2', icon: '🩺' },
  ];

  const supportLinks = [
    { title: 'Contact Support', href: '/rushhour/contact', icon: '💬' },
    { title: 'About Us', href: '/rushhour/about', icon: 'ℹ️' },
  ];

  const socialLinks = customLinks?.social || [
    { platform: 'YouTube', icon: 'fab fa-youtube', href: 'https://www.youtube.com/yourchannel' },
    { platform: 'TikTok', icon: 'fab fa-tiktok', href: 'https://www.tiktok.com/@yourprofile' },
    { platform: 'Facebook', icon: 'fab fa-facebook-f', href: 'https://www.facebook.com/yourpage' },
    { platform: 'Reddit', icon: 'fab fa-reddit', href: 'https://www.reddit.com/user/yourprofile' },
    { platform: 'Instagram', icon: 'fab fa-instagram', href: 'https://www.instagram.com/yourprofile' },
    { platform: 'LinkedIn', icon: 'fab fa-linkedin-in', href: 'https://www.linkedin.com/company/yourcompany' },
  ];

  const renderLinkItem = (link) => {
    const isExternal = link.href && !link.href.startsWith('/');
    const isLoading = loadingLink === link.href;

    const content = (
      <>
        <span className={styles.unicodeIcon}>{link.icon}</span>
        <span className={styles.linkText}>{link.title}</span>
        {isLoading && (
          <div className={styles.loadingSpinner}>
            <div className={styles.spinner}></div>
          </div>
        )}
      </>
    );

    if (link.href && !isExternal) {
      return (
        <Link 
          href={link.href} 
          className={`${styles.linkAnchor} ${isLoading ? styles.linkLoading : ''}`}
          onClick={() => handleLinkClick(link.href, false)}
        >
          {content}
        </Link>
      );
    }

    return (
      <a
        href={link.href}
        className={styles.linkAnchor}
        target="_blank"
        rel="noopener noreferrer"
      >
        {content}
      </a>
    );
  };

  return (
    <footer className={styles.footer}>
      {/* Main Footer Content */}
      <div className={styles.footerMain}>
        {/* Brand Section */}
        <div className={styles.brandSection}>
          <div className={styles.logoContainer}>
            <div className={styles.logo}>
              <Image 
                src="/bv.png" 
                alt="Rushhourcamp Logo" 
                width={60} 
                height={60}
                className={styles.logoImage}
              />
            </div>
            <div className={styles.brandText}>
              <h3 className={styles.brandName}>Rushhourcamp</h3>
              <p className={styles.tagline}>Empowering Healthcare Education</p>
            </div>
          </div>
          <p className={styles.description}>
            Designed to assess a student's preparedness for entering the health science field with comprehensive test preparation resources.
          </p>
          
          {/* Contact Info */}
          <div className={styles.contactInfo}>
            <div className={styles.contactItem}>
              <span className={styles.contactIcon}>📧</span>
              <a href="mailto:Support@Rushhourcamp.com" className={styles.contactLink}>
                Support@Rushhourcamp.com
              </a>
            </div>
            <div className={styles.contactItem}>
              <span className={styles.contactIcon}>📞</span>
              <a href="tel:+18175082244" className={styles.contactLink}>
                +1 (817) 508-2244
              </a>
            </div>
            <div className={styles.contactItem}>
              <span className={styles.contactIcon}>📍</span>
              <span className={styles.contactText}>Health Education Center</span>
            </div>
          </div>
        </div>

        {/* Links Grid */}
        <div className={styles.linksGrid}>
          {/* Company Links */}
          <div className={styles.linkCategory}>
            <h4 className={styles.categoryTitle}>
              <span className={styles.categoryIcon}>🏢</span>
              Company
            </h4>
            <div className={styles.linkList}>
              {companyLinks.map((link) => (
                <div key={link.title} className={styles.linkItem}>
                  {renderLinkItem(link)}
                </div>
              ))}
            </div>
          </div>

          {/* Resources Links */}
          <div className={styles.linkCategory}>
            <h4 className={styles.categoryTitle}>
              <span className={styles.categoryIcon}>📚</span>
              Resources
            </h4>
            <div className={styles.linkList}>
              {resourceLinks.map((link) => (
                <div key={link.title} className={styles.linkItem}>
                  {renderLinkItem(link)}
                </div>
              ))}
            </div>
          </div>

          {/* Support Links */}
          <div className={styles.linkCategory}>
            <h4 className={styles.categoryTitle}>
              <span className={styles.categoryIcon}>🛟</span>
              Support
            </h4>
            <div className={styles.linkList}>
              {supportLinks.map((link) => (
                <div key={link.title} className={styles.linkItem}>
                  {renderLinkItem(link)}
                </div>
              ))}
            </div>
          </div>

          {/* Newsletter Section */}
          {/* Newsletter Section */}
        <div className={styles.newsletterSection}>
            <h4 className={styles.categoryTitle}>
            <span className={styles.categoryIcon}>📰</span>
                Newsletter
            </h4>
            <p className={styles.newsletterText}>
              Get the latest study tips, resources, and healthcare education insights delivered to your inbox.
            </p>
            {/* embed the new form component (it contains input + subscribe button + success UI) */}
          <div className={styles.newsletterWrapper}>
            <NewsletterForm />
          </div>
        </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className={styles.footerBottom}>
        <div className={styles.footerBottomContent}>
          <div className={styles.copyright}>
            <span className={styles.copyrightIcon}>©</span>
            <span>2025 Rushhourcamp.com. All rights reserved.</span>
          </div>
          
          <div className={styles.bottomLinks}>
            <Link 
              href="/rushhour/privacy" 
              className={styles.bottomLink}
              onClick={() => handleLinkClick('/rushhour/privacy', false)}
            >
              Privacy Policy
              {loadingLink === '/rushhour/privacy' && <div className={styles.bottomLinkSpinner}></div>}
            </Link>
            <span className={styles.linkDivider}>•</span>
            <Link 
              href="/rushhour/terms" 
              className={styles.bottomLink}
              onClick={() => handleLinkClick('/rushhour/terms', false)}
            >
              Terms of Service
              {loadingLink === '/rushhour/terms' && <div className={styles.bottomLinkSpinner}></div>}
            </Link>
            <span className={styles.linkDivider}>•</span>
          </div>

          <div className={styles.socialLinks}>
            {socialLinks.map((social) => (
              <a
                key={social.platform}
                href={social.href}
                className={styles.socialLink}
                aria-label={social.platform}
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className={social.icon}></i>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;