import { useState, useEffect, useRef } from 'react';
import styles from './TestimonialCarousel.module.css';
import Modal from '../Modal/Modal';

const TestimonialCarousel = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  
  const scrollContainerRef = useRef(null);

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

  // Check scroll position to enable/disable nav buttons
  const updateScrollButtons = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const hasScroll = container.scrollWidth > container.clientWidth;
      setCanScrollLeft(container.scrollLeft > 10);
      setCanScrollRight(
        hasScroll && 
        container.scrollLeft < container.scrollWidth - container.clientWidth - 10
      );
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', updateScrollButtons);
      window.addEventListener('resize', updateScrollButtons);
      updateScrollButtons();
    }
    
    return () => {
      if (container) {
        container.removeEventListener('scroll', updateScrollButtons);
      }
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, [testimonials]);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -350,
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 350,
        behavior: 'smooth'
      });
    }
  };

  const handleViewCase = (evidenceUrl) => {
    if (evidenceUrl) {
      setSelectedEvidence(evidenceUrl);
      setShowModal(true);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedEvidence(null);
  };

  if (testimonials.length === 0) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p className={styles.loadingText}>Loading testimonials...</p>
      </div>
    );
  }

  return (
    <>
      <section className={styles.container}>
        {/* Background Elements */}
        <div className={styles.backgroundGradient}></div>
        <div className={styles.floatingOrb1}></div>
        <div className={styles.floatingOrb2}></div>
        
        <div className={styles.contentWrapper}>
          {/* Header Section */}
          <div className={styles.header}>
            <div className={styles.headerContent}>
              <div className={styles.titleSection}>
                <div className={styles.titleBadge}>
                  <span className={styles.badgeIcon}>✨</span>
                  Trusted by Many
                </div>
                <h2 className={styles.title}>Real Stories, Real Results</h2>
                <p className={styles.subtitle}>
                  Discover what our clients have to say about their experience
                </p>
              </div>
              
              <div className={styles.controls}>
                <button
                  className={`${styles.navButton} ${!canScrollLeft ? styles.disabled : ''}`}
                  onClick={scrollLeft}
                  disabled={!canScrollLeft}
                  aria-label="Scroll left"
                >
                  <span className={styles.navIcon}>←</span>
                </button>
                <button
                  className={`${styles.navButton} ${!canScrollRight ? styles.disabled : ''}`}
                  onClick={scrollRight}
                  disabled={!canScrollRight}
                  aria-label="Scroll right"
                >
                  <span className={styles.navIcon}>→</span>
                </button>
              </div>
            </div>
          </div>

          {/* Scroll Container */}
          <div className={styles.scrollArea}>
            <div 
              ref={scrollContainerRef}
              className={styles.scrollContainer}
              onScroll={updateScrollButtons}
            >
              <div className={styles.cardsContainer}>
                {testimonials.map((testimonial, index) => (
                  <article key={testimonial.id} className={styles.testimonialCard}>
                    {/* Card Glow Effect */}
                    <div className={styles.cardGlow}></div>
                    
                    {/* Profile Header */}
                    <header className={styles.cardHeader}>
                      <div className={styles.profile}>
                        <div className={styles.avatarWrapper}>
                          {testimonial.profile_url ? (
                            <img
                              src={testimonial.profile_url}
                              alt=""
                              className={styles.avatar}
                              loading="lazy"
                            />
                          ) : (
                            <div className={styles.avatarPlaceholder}>👤</div>
                          )}
                          <div className={styles.verifiedMark}>✓</div>
                        </div>
                        <div className={styles.profileText}>
                          <h3 className={styles.cardHeading}>{testimonial.heading}</h3>
                          <span className={styles.role}>{testimonial.role}</span>
                        </div>
                      </div>
                      <div className={styles.rating}>
                        <span className={styles.stars}>★★★★★</span>
                        <span className={styles.ratingScore}>5.0</span>
                      </div>
                    </header>

                    {/* Testimonial Content */}
                    <div className={styles.cardBody}>
                      <div className={styles.quoteSection}>
                        <span className={styles.quoteIcon}>❝</span>
                        <p className={styles.testimonialText}>{testimonial.description}</p>
                      </div>
                    </div>

                    {/* Evidence & Actions */}
                    <footer className={styles.cardFooter}>
                      <button 
                        className={`${styles.evidenceButton} ${!testimonial.evidence_url ? styles.disabled : ''}`}
                        onClick={() => handleViewCase(testimonial.evidence_url)}
                        disabled={!testimonial.evidence_url}
                      >
                        <span className={styles.buttonIcon}>📸</span>
                        View Evidence
                        {testimonial.evidence_url && (
                          <span className={styles.buttonBadge}>New</span>
                        )}
                      </button>
                      
                      <div className={styles.meta}>
                        <span className={styles.date}>
                          🗓️ {new Date(testimonial.created_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </footer>

                    {/* Decorative Elements */}
                    <div className={styles.cardCorner}></div>
                    <div className={styles.cardPattern}></div>
                  </article>
                ))}
              </div>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className={styles.scrollIndicator}>
            <div className={styles.scrollTrack}>
              <div 
                className={styles.scrollThumb}
                style={{
                  width: scrollContainerRef.current 
                    ? `${(scrollContainerRef.current.clientWidth / scrollContainerRef.current.scrollWidth) * 100}%`
                    : '0%',
                  left: scrollContainerRef.current 
                    ? `${(scrollContainerRef.current.scrollLeft / (scrollContainerRef.current.scrollWidth - scrollContainerRef.current.clientWidth)) * (100 - (scrollContainerRef.current.clientWidth / scrollContainerRef.current.scrollWidth) * 100)}%`
                    : '0%'
                }}
              ></div>
            </div>
          </div>
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