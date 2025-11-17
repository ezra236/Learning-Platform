import React from 'react';
import styles from './ContactPage.module.css';

const ContactGrid = () => {
  const contactMethods = [
    {
      id: 1,
      name: 'WhatsApp Chat',
      icon: '💬',
      description: 'Quick questions & instant support',
      action: 'Start Chat',
      link: 'https://wa.me/your-number',
      color: '#25D366',
      features: ['Instant replies', 'File sharing', '24/7 available']
    },
    {
      id: 2,
      name: 'Social Media',
      icon: '🌐',
      description: 'Daily tips & community support',
      action: 'Follow Us',
      links: [
        { name: 'Instagram', icon: '📷', url: 'https://instagram.com/rushhourcamp' },
        { name: 'Facebook', icon: '👥', url: 'https://facebook.com/rushhourcamp' },
        { name: 'TikTok', icon: '🎵', url: 'https://tiktok.com/@rushhourcamp' }
      ],
      color: '#E4405F'
    },
    {
      id: 3,
      name: 'Email Support',
      icon: '📧',
      description: 'Detailed questions & documents',
      action: 'Send Email',
      link: 'mailto:support@rushhourcamp.com',
      color: '#EA4335',
      features: ['Detailed responses', 'File attachments', '24h response']
    }
  ];

  return (
    <section className={styles.contactGrid}>
      <div className={styles.gridHeader}>
        <h2 className={styles.gridTitle}>Choose Your Support Channel</h2>
        <p className={styles.gridSubtitle}>
          Multiple ways to get the help you need for your nursing exam preparation
        </p>
      </div>
      
      <div className={styles.methodsGrid}>
        {contactMethods.map((method, index) => (
          <div 
            key={method.id} 
            className={styles.methodCard}
            style={{ '--accent-color': method.color }}
          >
            <div className={styles.cardHeader}>
              <div className={styles.methodIcon}>{method.icon}</div>
              <div className={styles.methodInfo}>
                <h3 className={styles.methodName}>{method.name}</h3>
                <p className={styles.methodDescription}>{method.description}</p>
              </div>
            </div>
            
            {method.features && (
              <div className={styles.methodFeatures}>
                {method.features.map((feature, idx) => (
                  <div key={idx} className={styles.feature}>
                    <span className={styles.featureIcon}>✓</span>
                    {feature}
                  </div>
                ))}
              </div>
            )}
            
            {method.links ? (
              <div className={styles.socialLinks}>
                {method.links.map((social, idx) => (
                  <a
                    key={idx}
                    href={social.url}
                    className={styles.socialLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className={styles.socialIcon}>{social.icon}</span>
                    {social.name}
                  </a>
                ))}
              </div>
            ) : (
              <a
                href={method.link}
                className={styles.actionButton}
                target="_blank"
                rel="noopener noreferrer"
              >
                {method.action}
                <span className={styles.actionArrow}>→</span>
              </a>
            )}
            
            <div className={styles.cardGlow}></div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ContactGrid;