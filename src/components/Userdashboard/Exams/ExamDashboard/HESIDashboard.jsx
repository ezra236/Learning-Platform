// Exams/ExamDashboard/HESIDashboard.jsx
"use client";

import React, { useState } from "react";
import styles from "./ExamDashboard.module.css";
import { useRouter } from "next/navigation";

export default function HESIDashboard({ exams = [] }) {
  const router = useRouter();
  const [loadingStates, setLoadingStates] = useState({});
  const [hoveredCard, setHoveredCard] = useState(null);

  const openMode = async (mode, examName) => {
    const key = `${examName}-${mode}`;
    setLoadingStates(prev => ({ ...prev, [key]: true }));
    
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const encoded = encodeURIComponent(examName);
      const path = `/user/hesi/${mode}/${encoded}`;
      router.push(path);
    } catch (error) {
      setLoadingStates(prev => ({ ...prev, [key]: false }));
    }
  };

  const getModeConfig = (mode) => {
    const config = {
      reviewmode: { 
        icon: "📖", 
        text: "Review", 
        description: "Study at your own pace",
        gradient: "linear-gradient(135deg, #3B82F6, #1D4ED8)"
      },
      tutormode: { 
        icon: "🎓", 
        text: "Tutor", 
        description: "Get instant feedback",
        gradient: "linear-gradient(135deg, #10B981, #047857)"
      },
      exammode: { 
        icon: "📝", 
        text: "Exam", 
        description: "Simulate real conditions",
        gradient: "linear-gradient(135deg, #EF4444, #DC2626)"
      }
    };
    return config[mode] || { 
      icon: "⚡", 
      text: mode, 
      description: "Start learning",
      gradient: "linear-gradient(135deg, #6B7280, #4B5563)"
    };
  };

  if (!exams || exams.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyAnimation}>
          <div className={styles.emptyIcon}>🧪</div>
          <div className={styles.emptyOrbit}></div>
        </div>
        <h3 className={styles.emptyTitle}>No HESI A2 Exams Available for this group</h3>
        <p className={styles.emptyMessage}>HESI A2 preparation materials</p>
        <button className={styles.emptyAction}>
          📚 Rushhourcamp
        </button>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      {exams.map((exam, index) => (
        <div 
          key={exam.name}
          className={`${styles.examCard} ${hoveredCard === exam.name ? styles.examCardHovered : ""}`}
          onMouseEnter={() => setHoveredCard(exam.name)}
          onMouseLeave={() => setHoveredCard(null)}
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className={styles.cardGlow}></div>
          <div className={styles.cardPattern}></div>
          
          <div className={styles.examHeader}>
            <div className={styles.examIconContainer}>
              <div className={styles.examIcon}>🔬</div>
              <div className={styles.iconSparkle}></div>
            </div>
            <div className={styles.examInfo}>
              <h3 className={styles.examName}>{exam.name}</h3>
              <p className={styles.examDescription}>HESI A2 Comprehensive Preparation</p>
              <div className={styles.examMeta}>
                <span className={styles.metaItem}>⏱️ {exam.total_questions} Questions</span>
                <span className={styles.metaItem}>📊 Detailed Analytics</span>
                <span className={styles.metaItem}>🎯 Adaptive Learning</span>
              </div>
            </div>
            <div className={styles.difficultyBadge}>
              <span className={styles.difficultyDot}></span>
              Intermediate
            </div>
          </div>
          
          <div className={styles.progressSection}>
            <div className={styles.progressHeader}>
              <span>Your Progress</span>
              <span className={styles.progressPercent}>{exam.user_progress}%</span>
            </div>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill} 
                style={{width: `${exam.user_progress}%`}}
                data-progress={exam.user_progress}
              ></div>
            </div>
          </div>
          
          <div className={styles.buttonGrid}>
            {["reviewmode", "tutormode", "exammode"].map((mode) => {
              const { icon, text, description, gradient } = getModeConfig(mode);
              const key = `${exam.name}-${mode}`;
              const isLoading = loadingStates[key];
              
              return (
                <button
                  key={mode}
                  className={styles.modeCard}
                  onClick={() => openMode(mode, exam.name)}
                  disabled={isLoading}
                  style={{ background: gradient }}
                >
                  {isLoading ? (
                    <div className={styles.loadingContent}>
                      <div className={styles.cardSpinner}></div>
                      <span>Launching...</span>
                    </div>
                  ) : (
                    <>
                      <div className={styles.modeIcon}>{icon}</div>
                      <div className={styles.modeText}>
                        <strong>{text}</strong>
                        <span>{description}</span>
                      </div>
                      <div className={styles.launchArrow}>
                        <div className={styles.arrowIcon}>→</div>
                      </div>
                    </>
                  )}
                  <div className={styles.modeHoverEffect}></div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
