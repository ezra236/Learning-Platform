import React from "react";
import styles from "./FrameTopBar.module.css";

export default function FrameTopBar({ examName, mode, timeLeft, totalQuestions, answeredCount, currentIndex }) {
  function formatTime(sec) {
    if (sec == null) return "--:--";
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = Math.floor(sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  const getTimeColor = () => {
    if (timeLeft == null) return styles.timeNormal;
    if (timeLeft < 300) return styles.timeCritical;
    if (timeLeft < 600) return styles.timeWarning;
    return styles.timeNormal;
  };

  return (
    <div className={styles.topbar}>
      <div className={styles.left}>
        <div className={styles.examInfo}>
          <h1 className={styles.examName}>📝 {examName}</h1>
          <span className={styles.mode}>{mode}</span>
        </div>
      </div>
      
      <div className={styles.center}>
        <div className={styles.progress}>
          <span className={styles.progressText}>
            📊 Q {currentIndex + 1} / {totalQuestions}
          </span>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
            ></div>
          </div>
        </div>
        <div className={styles.answered}>
          ✅ Answered: {answeredCount} / {totalQuestions}
        </div>
      </div>
      
      <div className={styles.right}>
        <div className={`${styles.timer} ${getTimeColor()}`}>
          <span className={styles.timerIcon}>⏱️</span>
          <span className={styles.timeText}>{formatTime(timeLeft)}</span>
        </div>
      </div>
    </div>
  );
}