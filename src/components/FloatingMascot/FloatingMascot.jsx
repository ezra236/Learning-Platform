'use client';
import { useState } from 'react';
import ReviewBlock from '../ReviewBlock/ReviewBlock';
import styles from './FloatingMascot.module.css';

const FloatingMascot = () => {
  const [isVisible, setIsVisible] = useState(false);

  const toggleReviewBlock = () => {
    setIsVisible(!isVisible);
  };

  return (
    <div className={styles.container}>
      <div 
        className={styles.mascot}
        onClick={toggleReviewBlock}
      >
        <div className={styles.mascotBody}>
          <div className={styles.face}>
            <div className={styles.eyes}>
              <div className={styles.eye}></div>
              <div className={styles.eye}></div>
            </div>
            <div className={styles.smile}></div>
          </div>
        </div>
        <div className={styles.messageBubble}>
          Leave a review! ✨
        </div>
      </div>

      {isVisible && (
        <ReviewBlock onClose={toggleReviewBlock} />
      )}
    </div>
  );
};

export default FloatingMascot;