import styles from './Blog.module.css';
import { useState, useEffect, useRef } from 'react';

const Blog = () => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef(null);
  const cardsRef = useRef([]);
  
  useEffect(() => {
    setIsVisible(true);
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.visible);
          }
        });
      },
      { 
        threshold: 0.1,
        rootMargin: '50px' 
      }
    );

    cardsRef.current.forEach((card) => {
      if (card) observer.observe(card);
    });

    return () => {
      cardsRef.current.forEach((card) => {
        if (card) observer.unobserve(card);
      });
    };
  }, []);

  const plans = [
    {
      title: "ATI TEAS 7",
      icon: "🧪",
      description: "Comprehensive preparation for the ATI TEAS 7 exam with practice tests and study materials",
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      features: ["2000+ Practice Questions", "Full-length Mock Tests", "Detailed Analytics", "Mobile App Access"],
      successRate: "98%",
      students: "5,000+"
    },
    {
      title: "HESI A2",
      icon: "📚",
      description: "Complete HESI A2 exam preparation course covering all sections",
      gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      features: ["All Subject Coverage", "Adaptive Learning", "Progress Dashboard", "Video Tutorials"],
      successRate: "96%",
      students: "3,500+"
    },
    {
      title: "NCLEX Prep",
      icon: "⚕️",
      description: "Everything you need to pass the NCLEX exam on your first attempt",
      gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      features: ["NCLEX-Style Questions", "Test-taking Strategies", "Performance Tracking", "Expert Support"],
      successRate: "99%",
      students: "8,000+"
    },
    {
      title: "Nursing Test Bank",
      icon: "💼",
      description: "Extensive collection of nursing test questions and answers",
      gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
      features: ["10,000+ Questions", "Specialty Categories", "Mobile Access", "Regular Updates"],
      successRate: "95%",
      students: "12,000+"
    },
    {
      title: "Exit Exams",
      icon: "🎓",
      description: "Prepare for your nursing program exit exams with confidence",
      gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
      features: ["Comprehensive Review", "Timed Practice", "Score Predictions", "Faculty Support"],
      successRate: "97%",
      students: "4,200+"
    }
  ];

  // Add card to ref array
  const addToRefs = (el) => {
    if (el && !cardsRef.current.includes(el)) {
      cardsRef.current.push(el);
    }
  };

  // Simple button handlers that do nothing but log
  const handleGetStarted = (planTitle) => {
    console.log(`Get Started clicked for ${planTitle}`);
    // Add your actual navigation logic here when ready
  };

  const handleFreeTrial = (planTitle) => {
    console.log(`Free Trial clicked for ${planTitle}`);
    // Add your actual free trial logic here when ready
  };

  const handleExplorePrograms = () => {
    console.log('Explore All Programs clicked');
  };

  const handleScheduleDemo = () => {
    console.log('Schedule Demo clicked');
  };

  return (
    <div 
      ref={containerRef}
      className={`${styles.container} ${isVisible ? styles.loaded : ''}`}
    >
      {/* Simple Light Background */}
      <div className={styles.backgroundWrapper}>
        <div className={styles.backgroundAnimation}></div>
      </div>
    
      
      {/* Main Plans Grid */}
      <main className={styles.mainContent}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionSubtitle}>Choose Your Preparation Plan</h2>
          <p className={styles.sectionSubtitle}>Select the program that matches your goals and start your journey today</p>
        </div>

        <div className={styles.plansGrid}>
          {plans.map((plan, index) => (
            <div 
              key={index} 
              ref={addToRefs}
              className={styles.planCard}
              style={{ 
                '--card-gradient': plan.gradient,
              }}
            >
              {/* Card Background Elements */}
              <div className={styles.cardGlow}></div>
              <div className={styles.cardShine}></div>
              
              {/* Card Content */}
              <div className={styles.cardContent}>
                {/* Card Header */}
                <div className={styles.cardHeader}>
                  <div className={styles.planIconWrapper}>
                    <div className={styles.iconBackground}></div>
                    <span className={styles.planIcon}>{plan.icon}</span>
                  </div>
                  <div className={styles.titleSection}>
                    <h3 className={styles.planTitle}>{plan.title}</h3>
                    <div className={styles.planBadge}>
                      <span className={styles.badgeText}>Most Popular</span>
                    </div>
                  </div>
                </div>
                
                {/* Description */}
                <p className={styles.planDescription}>{plan.description}</p>
                
                {/* Features List */}
                <div className={styles.featureList}>
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className={styles.featureItem}>
                      <div className={styles.featureIcon}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <span className={styles.featureText}>{feature}</span>
                    </div>
                  ))}
                </div>
                
                {/* Stats */}
                <div className={styles.planStats}>
                  <div className={styles.stat}>
                    <span className={styles.statValue}>{plan.successRate}</span>
                    <span className={styles.statLabel}>Success Rate</span>
                  </div>
                  <div className={styles.statDivider}></div>
                  <div className={styles.stat}>
                    <span className={styles.statValue}>{plan.students}</span>
                    <span className={styles.statLabel}>Students</span>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className={styles.buttonGroup}>
                  <button 
                    type="button"
                    className={styles.primaryButton}
                    onClick={() => handleGetStarted(plan.title)}
                  >
                    <span className={styles.buttonText}>Get Started</span>
                    <span className={styles.buttonIcon}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  </button>
                  <button 
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => handleFreeTrial(plan.title)}
                  >
                    <span className={styles.buttonText}>Free Trial</span>
                    <span className={styles.buttonIcon}>7 Days</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaCard}>
          <div className={styles.ctaBackground}></div>
          <div className={styles.ctaContent}>
            <h3 className={styles.ctaTitle}>Ready to Start Your Nursing Journey?</h3>
            <p className={styles.ctaText}>
              Join our community of successful nursing students and get the preparation 
              you need to pass your exams with confidence
            </p>
            
            <div className={styles.ctaFeatures}>
              <div className={styles.ctaFeature}>
                <span className={styles.featureIcon}>🎯</span>
                <span>Proven Success Methods</span>
              </div>
              <div className={styles.ctaFeature}>
                <span className={styles.featureIcon}>💡</span>
                <span>Expert-Crafted Content</span>
              </div>
              <div className={styles.ctaFeature}>
                <span className={styles.featureIcon}>🔄</span>
                <span>Continuous Updates</span>
              </div>
            </div>
            
            <div className={styles.ctaButtons}>
              <button 
                type="button"
                className={styles.ctaPrimary}
                onClick={handleExplorePrograms}
              >
                <span>Explore All Programs</span>
                <span className={styles.ctaIcon}>🎓</span>
              </button>
              <button 
                type="button"
                className={styles.ctaSecondary}
                onClick={handleScheduleDemo}
              >
                <span>Schedule a Demo</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <p className={styles.footerText}>
            © 2024 Rushhourcamp. All rights reserved. Your success is our mission.
          </p>
          <div className={styles.footerLinks}>
            <span className={styles.footerLink}>Privacy Policy</span>
            <span className={styles.footerLink}>Terms of Service</span>
            <span className={styles.footerLink}>Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Blog;