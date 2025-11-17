import React from 'react';
import styles from './HeroSection.module.css';

const HeroNclexPn = () => {
  const features = [
    { icon: '⚡', text: 'Fast-track Learning' },
    { icon: '📚', text: 'Comprehensive Study Material' },
    { icon: '🎯', text: 'Targeted Practice Tests' },
    { icon: '👨‍🏫', text: 'Expert Instructors' },
    { icon: '📱', text: 'Flexible Online Classes' },
    { icon: '📊', text: 'Performance Analytics' },
    { icon: '⏱️', text: 'Time Management Strategies' },
    { icon: '🏆', text: 'Proven Success Records' }
  ];

  return (
    <section className={styles.hero}>
      {/* Enhanced Background Elements */}
      <div className={styles.backgroundElements}>
        <div className={styles.floatingOrb1}></div>
        <div className={styles.floatingOrb2}></div>
        <div className={styles.floatingOrb3}></div>
        <div className={styles.gridPattern}></div>
      </div>

      <div className={styles.container}>
        <div className={styles.content}>
          {/* Header Section */}
          <div className={styles.headerSection}>
            <div className={styles.badgeGroup}>
              <div className={styles.badge}>
                <span className={styles.badgeIcon}>🎓</span>
                Trusted by 10,000+ Students
              </div>
              <div className={styles.ratingBadge}>
                <span className={styles.stars}>⭐⭐⭐⭐⭐</span>
                <span>4.9/5 Rating</span>
              </div>
            </div>
            
            <h1 className={styles.heading}>
              Master the <span className={styles.highlight}>Nclex -PN</span> TestBank
            </h1>
            
            <p className={styles.description}>
              Unlock your nursing school dreams with our comprehensive NCLEX - PN preparation program. 
              Get personalized coaching, extensive practice materials, and proven strategies to 
              achieve your target score.
            </p>

            <div className={styles.successMetrics}>
              <div className={styles.metricItem}>
                <div className={styles.metricValue}>97%</div>
                <div className={styles.metricLabel}>Success Rate</div>
              </div>
              <div className={styles.metricDivider}></div>
              <div className={styles.metricItem}>
                <div className={styles.metricValue}>10K+</div>
                <div className={styles.metricLabel}>Students Trained</div>
              </div>
              <div className={styles.metricDivider}></div>
              <div className={styles.metricItem}>
                <div className={styles.metricValue}>24/7</div>
                <div className={styles.metricLabel}>Support</div>
              </div>
            </div>
          </div>
          
          {/* Features Grid */}
          <div className={styles.featuresGrid}>
            {features.map((feature, index) => (
              <div key={index} className={styles.featureCard}>
                <div className={styles.featureIconContainer}>
                  <span className={styles.featureIcon}>{feature.icon}</span>
                </div>
                <span className={styles.featureText}>{feature.text}</span>
              </div>
            ))}
          </div>
          
          {/* CTA Section */}
          <div className={styles.ctaSection}>
            <div className={styles.ctaGroup}>
              <a href="/user/signup" className={styles.primaryCta}>
                <span className={styles.ctaMainText}>Start Your Success Journey</span>
                <span className={styles.ctaSubText}>Begin in 2 minutes • No credit card required</span>
                <span className={styles.ctaArrow}>→</span>
              </a>
              
              <div className={styles.secondaryCtaGroup}>
                <a href="/demo" className={styles.secondaryCta}>
                  <span className={styles.secondaryIcon}>🎬</span>
                  Watch Demo
                </a>
                <a href="/syllabus" className={styles.secondaryCta}>
                  <span className={styles.secondaryIcon}>📥</span>
                  Get Syllabus
                </a>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className={styles.trustIndicators}>
              <div className={styles.trustItem}>
                <div className={styles.trustIcon}>🔒</div>
                <div className={styles.trustText}>7-day money-back guarantee</div>
              </div>
              <div className={styles.trustItem}>
                <div className={styles.trustIcon}>💳</div>
                <div className={styles.trustText}>Flexible payment options</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Visual Section */}
        <div className={styles.visualSection}>
          <div className={styles.heroVisual}>
            <div className={styles.imageContainer}>
              <img 
                src="/v.jpg"  
                alt="ATI TEAS 7 Exam Preparation - Rushhourcamp"
                className={styles.heroImage}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className={styles.imageFallback}>
                <div className={styles.fallbackContent}>
                  <div className={styles.fallbackIcon}>📚</div>
                  <div className={styles.fallbackTitle}>TEAS 7 Success Program</div>
                  <div className={styles.fallbackSubtitle}>Start your journey today</div>
                </div>
              </div>
            </div>
            
            {/* Floating Achievement Cards */}
            <div className={styles.floatingCard1}>
              <div className={styles.cardIcon}>🎯</div>
              <div className={styles.cardContent}>
                <div className={styles.cardTitle}>Personalized</div>
                <div className={styles.cardText}>Study Plan</div>
              </div>
            </div>
            
            <div className={styles.floatingCard2}>
              <div className={styles.cardIcon}>📈</div>
              <div className={styles.cardContent}>
                <div className={styles.cardTitle}>Progress</div>
                <div className={styles.cardText}>Tracking</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroNclexPn;