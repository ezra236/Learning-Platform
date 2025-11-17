import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBookOpen, 
  faChartLine, 
  faGraduationCap, 
  faUserTie,
  faChevronLeft,
  faChevronRight,
  faStar,
  faCheckCircle,
  faRocket
} from '@fortawesome/free-solid-svg-icons';
import styles from '../../styles/preview.module.css';

const PreviewCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const slides = [
    {
      id: 1,
      image: "/ic.png",
      title: "Interactive Course Pages",
      description: "Engaging learning materials with interactive elements that make complex topics easy to understand",
      icon: faBookOpen,
      features: ["Interactive Videos", "Real-time Coding", "Progress Tracking"],
      color: "#4f46e5"
    },
    {
      id: 2,
      image: "/sd.jpeg",
      title: "Student Dashboard",
      description: "Track your progress and manage your learning journey with detailed analytics and insights",
      icon: faChartLine,
      features: ["Performance Analytics", "Achievement Badges", "Learning Paths"],
      color: "#059669"
    },
    {
      id: 3,
      image: "/p.jpeg",
      title: "Practice Quizzes",
      description: "Test your knowledge with instant feedback and personalized recommendations for improvement",
      icon: faGraduationCap,
      features: ["Instant Feedback", "Adaptive Difficulty", "Detailed Explanations"],
      color: "#dc2626"
    },
    {
      id: 4,
      image: "/i.jpeg",
      title: "Expert Instructors",
      description: "Learn from industry professionals with years of real-world experience and teaching expertise",
      icon: faUserTie,
      features: ["Industry Experts", "1-on-1 Mentoring", "Career Guidance"],
      color: "#7c3aed"
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  // Keyboard navigation (left/right arrows only)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'ArrowRight') nextSlide();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <section 
      className={styles.carouselSection} 
      aria-label="Course preview carousel"
    >
      <div className={styles.carouselContainer}>
        {/* Animated background elements */}
        <div className={styles.backgroundShapes}>
          <div className={styles.shape1}></div>
          <div className={styles.shape2}></div>
          <div className={styles.shape3}></div>
        </div>

        {/* Header with title and controls */}
        <div className={styles.carouselHeader}>
          <div className={styles.headerContent}>
            <div className={styles.badge}>
              <FontAwesomeIcon icon={faStar} className={styles.badgeIcon} />
              Premium Learning Experience
            </div>
            <h2 className={styles.sectionTitle}>
              Transform Your Skills with 
              <span className={styles.highlight}> Interactive Learning</span>
            </h2>
            <p className={styles.sectionSubtitle}>
              Discover why thousands of students choose our platform for nursing exams preparations.
            </p>
          </div>
          
          <div className={styles.controlsGroup}>
            <div className={styles.slideCounter}>
              <span className={styles.currentSlide}>0{currentSlide + 1}</span>
              <span className={styles.slideSeparator}>/</span>
              <span className={styles.totalSlides}>0{slides.length}</span>
            </div>
          </div>
        </div>

        {/* Main Carousel */}
        <div className={styles.carouselWrapper}>
          <button 
            className={styles.carouselButton} 
            onClick={prevSlide}
            aria-label="Previous slide"
          >
            <FontAwesomeIcon icon={faChevronLeft} className={styles.buttonIcon} />
          </button>
          
          <div className={styles.carouselViewport}>
            <div 
              className={styles.carouselTrack}
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {slides.map((slide, index) => (
                <div 
                  key={slide.id}
                  className={`${styles.slide} ${index === currentSlide ? styles.activeSlide : ''}`}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${index + 1} of ${slides.length}`}
                  aria-hidden={index !== currentSlide}
                >
                  <div 
                    className={styles.card}
                    style={{ '--accent-color': slide.color }}
                  >
                    {/* Card Header with Icon */}
                    <div className={styles.cardHeader}>
                      <div 
                        className={styles.iconWrapper}
                        style={{ backgroundColor: `${slide.color}15` }}
                      >
                        <FontAwesomeIcon 
                          icon={slide.icon} 
                          className={styles.slideIcon}
                          style={{ color: slide.color }}
                        />
                      </div>
                      <div className={styles.titleWrapper}>
                        <h3 className={styles.cardTitle}>{slide.title}</h3>
                        <div className={styles.featurePills}>
                          {slide.features.map((feature, featureIndex) => (
                            <span key={featureIndex} className={styles.featurePill}>
                              <FontAwesomeIcon icon={faCheckCircle} className={styles.featureIcon} />
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Image Section */}
                    <div className={styles.imageSection}>
                      <div className={styles.imageContainer}>
                        <div className={styles.imageWrapper}>
                          <Image
                            src={slide.image}
                            alt={`Preview of ${slide.title}`}
                            width={700}
                            height={400}
                            className={styles.image}
                            priority={index === 0}
                          />
                          <div 
                            className={styles.imageOverlay}
                            style={{ background: `linear-gradient(135deg, ${slide.color}20 0%, transparent 50%)` }}
                          ></div>
                          
                          {/* Floating elements */}
                          <div className={styles.floatingElement1}></div>
                          <div className={styles.floatingElement2}></div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Card Content */}
                    <div className={styles.cardContent}>
                      <p className={styles.cardDescription}>{slide.description}</p>
                      
                      <div className={styles.progressSection}>
                        <div className={styles.progressIndicator}>
                          <span className={styles.slideNumber}>
                            Featured Module
                          </span>
                          <div className={styles.progressBar}>
                            <div 
                              className={styles.progressFill} 
                              style={{ 
                                width: `${((index + 1) / slides.length) * 100}%`,
                                background: `linear-gradient(90deg, ${slide.color} 0%, ${slide.color}99 100%)`
                              }}
                            ></div>
                          </div>
                        </div>
                        
                        <div className={styles.achievementBadge}>
                          <FontAwesomeIcon icon={faRocket} className={styles.badgeIcon} />
                          <span>Premium Feature</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <button 
            className={styles.carouselButton} 
            onClick={nextSlide}
            aria-label="Next slide"
          >
            <FontAwesomeIcon icon={faChevronRight} className={styles.buttonIcon} />
          </button>
        </div>

        {/* Enhanced navigation dots */}
        <div 
          className={styles.dotsContainer}
          role="tablist"
          aria-label="Slide navigation dots"
        >
          {slides.map((slide, index) => (
            <button
              key={index}
              className={`${styles.dot} ${index === currentSlide ? styles.activeDot : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}: ${slide.title}`}
              aria-selected={index === currentSlide}
              role="tab"
            >
              <div className={styles.dotContent}>
                <FontAwesomeIcon 
                  icon={slide.icon} 
                  className={styles.dotIcon}
                />
                <span className={styles.dotLabel}>{slide.title}</span>
              </div>
              <div 
                className={styles.dotProgress} 
                style={{ backgroundColor: slide.color }}
              ></div>
            </button>
          ))}
        </div>

        {/* Enhanced CTA Section */}
        <div className={styles.ctaSection}>
          <div className={styles.ctaBackground}></div>
          <div className={styles.ctaContent}>
            <div className={styles.ctaText}>
              <h3 className={styles.ctaTitle}>Ready to Start Your Learning Journey?</h3>
              <p className={styles.ctaDescription}>
                Join <strong>25,000+ students</strong> who have transformed their careers with our platform
              </p>
              <div className={styles.trustIndicators}>
                <div className={styles.trustItem}>
                  <span className={styles.trustNumber}>4.9/5</span>
                  <span className={styles.trustLabel}>Student Rating</span>
                </div>
                <div className={styles.trustItem}>
                  <span className={styles.trustNumber}>98%</span>
                  <span className={styles.trustLabel}>Completion Rate</span>
                </div>
                <div className={styles.trustItem}>
                  <span className={styles.trustNumber}>24/7</span>
                  <span className={styles.trustLabel}>Support</span>
                </div>
              </div>
            </div>
            
            <div className={styles.ctaActions}>
              <div className={styles.ctaButtons}>
                <Link href="/user/signup" className={styles.ctaButtonPrimary}>
                  <FontAwesomeIcon icon={faRocket} className={styles.buttonIcon} />
                  Start Free Trial
                </Link>
                <Link href="/rushhoour/courses" className={styles.ctaButtonSecondary}>
                  Browse All Plans
                </Link>
              </div>
              <p className={styles.ctaNote}>
                <FontAwesomeIcon icon={faCheckCircle} className={styles.noteIcon} />
                No credit card required • 14-day free trial
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PreviewCarousel;
