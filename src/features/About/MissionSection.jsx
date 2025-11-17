import styles from './MissionSection.module.css';

const MissionSection = () => {
  const missions = [
    {
      image: "/lx.jpg",
      icon: "🎯",
      title: "Our Mission",
      description: "To provide nursing students with the most comprehensive and effective exam preparation platform, helping them achieve academic excellence and build confidence for their nursing careers.",
      features: ["Personalized Learning Paths", "Expert-Created Content", "Real-time Progress Tracking"]
    },
    {
      image: "/rx.jpg", 
      icon: "👁️",
      title: "Our Vision",
      description: "To become the leading global platform for nursing education, transforming how students prepare for critical exams and shaping the future of healthcare professionals worldwide.",
      features: ["Global Reach", "Innovation in EdTech", "Healthcare Impact"]
    },
    {
      image: "/dx.jpg",
      icon: "💎",
      title: "Our Values",
      description: "Excellence, Innovation, Student Success, Integrity, and Continuous Improvement guide everything we do at Rushhourcamp.",
      features: ["Student-First Approach", "Quality Excellence", "Ethical Practices"]
    }
  ];

  return (
    <section className={styles.mission}>
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Our Commitment to Excellence</h2>
          <p className={styles.sectionSubtitle}>
            We are dedicated to revolutionizing nursing education through innovative 
            technology and evidence-based learning methodologies.
          </p>
        </div>
        
        <div className={styles.missionGrid}>
          {missions.map((mission, index) => (
            <div key={index} className={styles.missionCard}>
              <div className={styles.imageContainer}>
                <img 
                  src={mission.image} 
                  alt={mission.title}
                  className={styles.missionImage}
                />
                <div className={styles.imageOverlay}></div>
                <div className={styles.cardIcon}>{mission.icon}</div>
              </div>
              
              <div className={styles.cardContent}>
                <h3 className={styles.cardTitle}>{mission.title}</h3>
                <p className={styles.cardDescription}>{mission.description}</p>
                
                <ul className={styles.featuresList}>
                  {mission.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className={styles.featureItem}>
                      <span className={styles.featureIcon}>✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MissionSection;