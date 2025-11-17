'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './FeaturesSection.module.css';

const FeaturesSection = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const features = [
    {
      icon: '📚',
      title: 'Comprehensive Study Materials',
      description:
        'Access extensive libraries for ATI TEAS 7, NCLEX, and nursing test banks with regularly updated content and expert-reviewed materials.',
    },
    {
      icon: '🎮',
      title: 'Interactive Learning',
      description:
        'Engage with adaptive quizzes, realistic simulations, and personalized learning paths that adjust to your progress and learning style.',
    },
    {
      icon: '📊',
      title: 'Performance Analytics',
      description:
        'Track your progress with detailed analytics, identify weak areas, and receive smart insights for targeted improvement.',
    },
    {
      icon: '⏱️',
      title: 'Timed Exam Simulations',
      description:
        'Practice with realistic simulations that mimic actual test conditions, time constraints, and question formats.',
    },
    {
      icon: '👥',
      title: 'Collaborative Learning',
      description:
        'Join study groups, participate in discussions, and learn from peers and expert instructors in our community platform.',
    },
    {
      icon: '📱',
      title: 'Mobile Friendly',
      description:
        'Study seamlessly across all devices with our fully responsive platform that works perfectly on desktop, tablet, and mobile.',
    },
  ];

  const handleGetStarted = () => {
    setLoading(true);
    // Add a short delay for UX feedback (optional)
    setTimeout(() => {
      router.push('/user/signup/');
    }, 800);
  };

  return (
    <section className={styles.features}>
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Why Choose Rushhourcamp?</h2>
          <p className={styles.sectionSubtitle}>
            Experience the difference with our comprehensive platform designed 
            specifically for nursing students' success and academic excellence.
          </p>
        </div>

        <div className={styles.featuresGrid}>
          {features.map((feature, index) => (
            <div
              key={index}
              className={styles.featureCard}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={styles.featureIconContainer}>
                <span className={styles.featureIcon}>{feature.icon}</span>
                <div className={styles.iconBackground}></div>
              </div>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureDescription}>{feature.description}</p>
              <div className={styles.featureHover}></div>
            </div>
          ))}
        </div>

        <div className={styles.ctaSection}>
          <div className={styles.ctaContent}>
            <h3 className={styles.ctaTitle}>Ready to Transform Your Learning Experience?</h3>
            <p className={styles.ctaText}>
              Join thousands of successful nursing students today.
            </p>
            <button
              className={styles.ctaButton}
              onClick={handleGetStarted}
              disabled={loading}
            >
              {loading ? 'Redirecting...' : 'Get Started Now 🚀'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
