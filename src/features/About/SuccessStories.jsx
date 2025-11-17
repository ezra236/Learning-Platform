import styles from './SuccessStories.module.css';

const SuccessStories = () => {
  const stories = [
    {
      name: "Sarah Johnson",
      exam: "NCLEX-RN",
      result: "Passed on First Attempt",
      story: "Rushhourcamp's simulated exams and detailed analytics helped me identify my weak areas and build confidence. The platform made studying efficient and effective!",
      avatar: "👩‍⚕️",
      score: "92%"
    },
    {
      name: "Michael Chen",
      exam: "ATI TEAS 7",
      result: "Outstanding Score",
      story: "The comprehensive study materials and practice questions were instrumental in achieving my target score. I couldn't have done it without this platform!",
      avatar: "👨‍⚕️",
      score: "96%"
    },
    {
      name: "Emily Rodriguez",
      exam: "Nursing Test Banks",
      result: "Top 5% in Class",
      story: "The platform's adaptive learning technology personalized my study plan and maximized my efficiency. It truly understands how students learn best!",
      avatar: "👩‍🎓",
      score: "98%"
    }
  ];

  return (
    <section className={styles.success}>
      <div className={styles.container}>
        <div className={styles.contentGrid}>
          <div className={styles.imageSection}>
            <img 
              src="/bh.jpg" 
              alt="Student celebrating success" 
              className={styles.successImage}
            />
            <div className={styles.imageBadges}>
              <div className={styles.badge}>
                <span className={styles.badgeIcon}>🎉</span>
                <div className={styles.badgeContent}>
                  <strong>2,000+</strong>
                  <span>Success Stories</span>
                </div>
              </div>
              <div className={styles.badge}>
                <span className={styles.badgeIcon}>⭐</span>
                <div className={styles.badgeContent}>
                  <strong>4.9/5</strong>
                  <span>Student Rating</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className={styles.storiesSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Real Stories, Real Success</h2>
              <p className={styles.sectionSubtitle}>
                Join thousands of nursing students who have transformed their 
                exam preparation and achieved outstanding results with Rushhourcamp.
              </p>
            </div>
            
            <div className={styles.storiesList}>
              {stories.map((story, index) => (
                <div key={index} className={styles.storyCard}>
                  <div className={styles.storyHeader}>
                    <div className={styles.studentMain}>
                      <span className={styles.avatar}>{story.avatar}</span>
                      <div className={styles.studentInfo}>
                        <h4 className={styles.studentName}>{story.name}</h4>
                        <span className={styles.examType}>{story.exam}</span>
                      </div>
                    </div>
                    <div className={styles.resultBadge}>
                      <span className={styles.score}>{story.score}</span>
                      <span className={styles.result}>{story.result}</span>
                    </div>
                  </div>
                  <p className={styles.storyText}>"{story.story}"</p>
                  <div className={styles.storyFooter}>
                    <div className={styles.verification}>
                      <span className={styles.verified}>✅ Verified Success</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SuccessStories;