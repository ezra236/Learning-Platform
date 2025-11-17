"use client";
import Image from 'next/image';
import { useState, useEffect } from 'react';
import styles from './css/BenefitsGrid.module.css';

const BenefitsGrid = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const benefits = [
    {
      id: 1,
      icon: "/a.jpeg",
      title: "Interactive Nursing Modules",
      description: "Learn anatomy, pharmacology, and clinical practice through bite-sized lessons."
    },
    {
      id: 2,
      icon: "/c.jpeg",
      title: "Exam Preparation Tools",
      description: "Access NCLEX-style quizzes and adaptive testing to boost your confidence."
    },
    {
      id: 3,
      icon: "/d.jpeg",
      title: "Expert Nursing Tutors",
      description: "Learn from certified nurses and healthcare educators."
    },
    {
      id: 4,
      icon: "/x.jpeg",
      title: "Peer Study Groups",
      description: "Collaborate with fellow students for group discussions and study support."
    },
    {
      id: 5,
      icon: "/ks.jpeg",
      title: "Track Your Progress",
      description: "Personalized dashboards that monitor your learning goals."
    },
    {
      id: 6,
      icon: "/kl.jpeg",
      title: "Real-World Scenarios",
      description: "Practice decision-making with simulated case studies."
    }
  ];

  return (
    <section className={styles.benefitsSection} aria-labelledby="benefits-heading">
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h2 id="benefits-heading" className={styles.heading}>
              Excellence in Nursing Education
            </h2>
            <p className={styles.subheading}>
              Comprehensive tools and resources designed to accelerate your nursing career journey
            </p>
            <div className={styles.headerDivider}></div>
          </div>
        </div>
        
        <div className={styles.grid}>
          {benefits.map((benefit, index) => (
            <div 
              key={benefit.id}
              className={`${styles.card} ${isVisible ? styles.visible : ''}`}
              role="listitem"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={styles.cardInner}>
                <div className={styles.iconWrapper}>
                  <div className={styles.iconBackground}>
                    <Image
                      src={benefit.icon}
                      alt=""
                      width={60}
                      height={60}
                      className={styles.icon}
                    />
                  </div>
                  <div className={styles.iconNumber}>0{index + 1}</div>
                </div>
                
                <div className={styles.cardContent}>
                  <h3 className={styles.cardTitle}>{benefit.title}</h3>
                  <p className={styles.cardDescription}>{benefit.description}</p>
                </div>
                
                <div className={styles.cardHover}>
                  <div className={styles.hoverLine}></div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default BenefitsGrid;