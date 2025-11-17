import { useState, useEffect, useCallback, useRef } from 'react';
import styles from './TestimonialCarousel.module.css';
import Modal from '../Modal/Modal';

const TestimonialCarousel = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [touchStartX, setTouchStartX] = useState(null);
  const carouselRef = useRef(null);
  const timeoutRef = useRef(null);

  // API base from env
  const API_BASE_RAW = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_API_BASE_URL : undefined;
  const API_BASE = API_BASE_RAW ? API_BASE_RAW.replace(/\/+$/, '') : '';
  const PUBLIC_EVIDENCES_ENDPOINT = API_BASE ? `${API_BASE}/api/public/evidences/` : '/api/public/evidences/';

  // Fetch testimonials from API
  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const response = await fetch(PUBLIC_EVIDENCES_ENDPOINT);
        const data = await response.json();
        setTestimonials(data.results || []);
      } catch (error) {
        console.error('Error fetching testimonials:', error);
      }
    };

    fetchTestimonials();
  }, [PUBLIC_EVIDENCES_ENDPOINT]);

  // Auto-advance functionality
  useEffect(() => {
    if (isPaused || testimonials.length === 0 || isTransitioning) return;

    timeoutRef.current = setTimeout(() => {
      handleNext();
    }, 5000);

    return () => clearTimeout(timeoutRef.current);
  }, [currentIndex, isPaused, testimonials.length, isTransitioning]);

  const handleNext = useCallback(() => {
    if (testimonials.length === 0 || isTransitioning) return;
    
    setIsTransitioning(true);
    setCurrentIndex(prev => (prev + 1) % testimonials.length);
    
    setTimeout(() => setIsTransitioning(false), 700);
  }, [testimonials.length, isTransitioning]);

  const handlePrev = useCallback(() => {
    if (testimonials.length === 0 || isTransitioning) return;
    
    setIsTransitioning(true);
    setCurrentIndex(prev => prev === 0 ? testimonials.length - 1 : prev - 1);
    
    setTimeout(() => setIsTransitioning(false), 700);
  }, [testimonials.length, isTransitioning]);

  const togglePause = () => {
    setIsPaused(prev => !prev);
  };

  const handleThumbnailClick = (index) => {
    if (isTransitioning) return;
    setCurrentIndex(index);
  };

  const handleViewCase = (evidenceUrl) => {
    setSelectedEvidence(evidenceUrl);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedEvidence(null);
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (!touchStartX) return;

    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }

    setTouchStartX(null);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === ' ' || e.key === 'Space') togglePause();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev]);

  if (testimonials.length === 0) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p className={styles.loadingText}>Loading testimonials...</p>
      </div>
    );
  }

  // Get visible items: previous, current, next for thumbnails
  const getVisibleThumbnails = () => {
    const thumbnails = [];
    for (let i = 1; i <= 3; i++) {
      const index = (currentIndex + i) % testimonials.length;
      thumbnails.push(testimonials[index]);
    }
    return thumbnails;
  };

  const currentTestimonial = testimonials[currentIndex];
  const visibleThumbnails = getVisibleThumbnails();

  return (
    <>
      <section 
        ref={carouselRef}
        className={styles.carousel}
        role="region"
        aria-roledescription="testimonial carousel"
        aria-label="Customer testimonials"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => !isPaused && setIsPaused(false)}
      >
        {/* Background Decorative Elements */}
        <div className={styles.backgroundOrnament}></div>
        <div className={styles.floatingShape1}></div>
        <div className={styles.floatingShape2}></div>

        {/* Pause/Play Control */}
        <button
          className={styles.pausePlay}
          onClick={togglePause}
          aria-label={isPaused ? 'Play carousel' : 'Pause carousel'}
        >
          <i className={`fas ${isPaused ? 'fa-play' : 'fa-pause'}`}></i>
        </button>

        <div className={styles.carouselContent}>
          {/* Thumbnails Column */}
          <div className={styles.thumbnailsColumn}>
            <div className={styles.thumbnailsHeader}>
              <i className="fas fa-users"></i>
              <span>Testimonials</span>
            </div>
            {visibleThumbnails.map((testimonial, index) => (
              <div
                key={testimonial.id}
                className={`${styles.thumbnail} ${index === 0 ? styles.nextInLine : ''}`}
                onClick={() => handleThumbnailClick((currentIndex + index + 1) % testimonials.length)}
              >
                <div className={styles.thumbnailContent}>
                  <div className={styles.thumbnailBadge}>
                    <i className="fas fa-quote-left"></i>
                  </div>
                  <div className={styles.thumbnailText}>
                    <h4 className={styles.thumbnailHeading}>{testimonial.heading}</h4>
                    <p className={styles.thumbnailDescription}>
                      {testimonial.description.length > 80 
                        ? `${testimonial.description.substring(0, 80)}...`
                        : testimonial.description
                      }
                    </p>
                    <div className={styles.thumbnailFooter}>
                      <div className={styles.stars}>
                        {[...Array(5)].map((_, i) => (
                          <i key={i} className="fas fa-star"></i>
                        ))}
                      </div>
                      <span className={styles.thumbnailRole}>{testimonial.role}</span>
                    </div>
                  </div>
                  {testimonial.profile_url && (
                    <div className={styles.thumbnailImageContainer}>
                      <img
                        src={testimonial.profile_url}
                        alt=""
                        className={styles.thumbnailAvatar}
                      />
                      <div className={styles.thumbnailOverlay}>
                        <i className="fas fa-eye"></i>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Focused Testimonial */}
          <div className={styles.focusedPanel}>
            <div className={styles.focusedCard}>
              <div className={styles.focusedContent}>
                <div className={styles.quoteContainer}>
                  <i className="fas fa-quote-left"></i>
                </div>
                
                <div className={styles.testimonialHeader}>
                  <h2 className={styles.focusedHeading}>{currentTestimonial.heading}</h2>
                  <div className={styles.verifiedBadge}>
                    <i className="fas fa-check-circle"></i>
                    Verified User
                  </div>
                </div>
                
                <p className={styles.focusedDescription}>{currentTestimonial.description}</p>
                
                <div className={styles.ratingContainer}>
                  <div className={styles.stars}>
                    {[...Array(5)].map((_, i) => (
                      <i key={i} className="fas fa-star"></i>
                    ))}
                  </div>
                  <div className={styles.ratingInfo}>
                    <span className={styles.role}>{currentTestimonial.role}</span>
                    <div className={styles.ratingDivider}></div>
                    <span className={styles.ratingText}>5.0 Rating</span>
                  </div>
                </div>

                <button 
                  className={styles.ctaButton}
                  onClick={() => handleViewCase(currentTestimonial.evidence_url)}
                >
                  <i className="fas fa-external-link-alt"></i>
                  Evidence
                </button>
              </div>

              {currentTestimonial.profile_url && (
                <div className={styles.portraitContainer}>
                  <div className={styles.portraitFrame}>
                    <img
                      src={currentTestimonial.profile_url}
                      alt={`Portrait of ${currentTestimonial.role}`}
                      className={styles.portrait}
                    />
                    <div className={styles.portraitGlow}></div>
                  </div>
                  <div className={styles.portraitDecoration}>
                    <i className="fas fa-award"></i>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Dots */}
        <div className={styles.navigationDots}>
          {testimonials.slice(0, 5).map((_, index) => (
            <button
              key={index}
              className={`${styles.dot} ${index === currentIndex % 5 ? styles.activeDot : ''}`}
              onClick={() => setCurrentIndex(index)}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>

        {/* Mobile Navigation */}
        <div className={styles.mobileNav}>
          <button 
            className={styles.navButton}
            onClick={handlePrev}
            aria-label="Previous testimonial"
          >
            <i className="fas fa-chevron-left"></i>
          </button>
          <button 
            className={styles.navButton}
            onClick={handleNext}
            aria-label="Next testimonial"
          >
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      </section>

      {/* Modal for Evidence Image */}
      <Modal 
        isOpen={showModal}
        onClose={closeModal}
        imageUrl={selectedEvidence}
      />
    </>
  );
};

export default TestimonialCarousel;