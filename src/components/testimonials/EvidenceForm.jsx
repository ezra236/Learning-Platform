// EvidenceForm.jsx
import { useState, useRef, useEffect } from 'react';
import styles from './EvidenceForm.module.css';
import ActionToast from './ActionToast';

const EvidenceForm = () => {
  const [formData, setFormData] = useState({
    heading: '',
    description: '',
    role: ''
  });

  const [profileImage, setProfileImage] = useState(null);
  const [evidenceImage, setEvidenceImage] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const [evidencePreview, setEvidencePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeStep, setActiveStep] = useState(1);

  // toast state
  const [toast, setToast] = useState({ show: false, type: 'success', message: '' });

  const profileInputRef = useRef(null);
  const evidenceInputRef = useRef(null);
  const formRef = useRef(null);

  // API base from env (NEXT_PUBLIC_ prefix is required for Next/CRA to expose to client)
  const API_BASE_RAW = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_API_BASE_URL : undefined;
  const API_BASE = API_BASE_RAW ? API_BASE_RAW.replace(/\/+$/, '') : ''; // strip trailing slash if present
  const EVIDENCE_ENDPOINT = API_BASE ? `${API_BASE}/api/evidence/` : '/api/evidence/';
  const CSRF_ENDPOINT = API_BASE ? `${API_BASE}/api/csrf/` : '/api/csrf/';

  useEffect(() => {
    let t;
    if (toast.show) {
      t = setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4500);
    }
    return () => clearTimeout(t);
  }, [toast.show]);

  // ensure CSRF cookie is set when the component mounts
  useEffect(() => {
    const ensureCsrfCookie = async () => {
      try {
        // call the csrf endpoint; backend should set csrftoken cookie
        await fetch(CSRF_ENDPOINT, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json'
          }
        });
      } catch (err) {
        // don't block UI if CSRF fetch fails — we'll still try on submit
        // but log for debugging
        // eslint-disable-next-line no-console
        console.warn('Failed to fetch CSRF endpoint', err);
      }
    };

    ensureCsrfCookie();
  }, [CSRF_ENDPOINT]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e, type) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      if (type === 'profile') {
        setProfileImage(file);
        setProfilePreview(URL.createObjectURL(file));
      } else {
        setEvidenceImage(file);
        setEvidencePreview(URL.createObjectURL(file));
      }
    }
  };

  const triggerFileInput = (type) => {
    if (type === 'profile') {
      profileInputRef.current?.click();
    } else {
      evidenceInputRef.current?.click();
    }
  };

  const removeImage = (type) => {
    if (type === 'profile') {
      setProfileImage(null);
      setProfilePreview(null);
      if (profileInputRef.current) profileInputRef.current.value = '';
    } else {
      setEvidenceImage(null);
      setEvidencePreview(null);
      if (evidenceInputRef.current) evidenceInputRef.current.value = '';
    }
  };

  // get csrftoken from cookies
  const getCookie = (name) => {
    const matches = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)'));
    return matches ? decodeURIComponent(matches[1]) : undefined;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = new FormData();
      payload.append('heading', formData.heading);
      payload.append('description', formData.description);
      payload.append('role', formData.role);

      if (profileImage) payload.append('profile_image', profileImage);
      if (evidenceImage) payload.append('evidence_image', evidenceImage);

      const csrftoken = getCookie('csrftoken');

      const res = await fetch(EVIDENCE_ENDPOINT, {
        method: 'POST',
        body: payload,
        credentials: 'include', // important to send session cookie
        headers: {
          // DO NOT set Content-Type for multipart/form-data
          'X-CSRFToken': csrftoken || '',
          'Accept': 'application/json'
        }
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        const message = json?.error || json?.detail || `Failed (${res.status})`;
        setToast({ show: true, type: 'error', message });
      } else {
        setToast({ show: true, type: 'success', message: json.detail || 'Submitted successfully' });
        // reset form
        setFormData({ heading: '', description: '', role: '' });
        removeImage('profile');
        removeImage('evidence');
        setActiveStep(1);
      }
    } catch (err) {
      setToast({ show: true, type: 'error', message: err.message || 'Network error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (activeStep < 3) setActiveStep(activeStep + 1);
  };

  const prevStep = () => {
    if (activeStep > 1) setActiveStep(activeStep - 1);
  };

  return (
    <div className={styles.container}>
      <div className={styles.backgroundElements}>
        <div className={styles.floatingElement1}></div>
        <div className={styles.floatingElement2}></div>
        <div className={styles.floatingElement3}></div>
        <div className={styles.floatingElement4}></div>
      </div>

      <div className={styles.formWrapper}>
        <div className={styles.sidePanel}>
          <div className={styles.panelContent}>
            <div className={styles.brand}>
              <div className={styles.brandIcon}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12L11 14L15 10M21 16V8C21 6.89543 20.1046 6 19 6H5C3.89543 6 3 6.89543 3 8V16C3 17.1046 3.89543 18 5 18H19C20.1046 18 21 17.1046 21 16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 className={styles.brandName}>Testimonials</h2>
            </div>
            
            <div className={styles.steps}>
              <div className={`${styles.step} ${activeStep >= 1 ? styles.active : ''}`}>
                <div className={styles.stepNumber}>1</div>
                <div className={styles.stepInfo}>
                  <div className={styles.stepTitle}>Basic Information</div>
                  <div className={styles.stepDescription}>Enter case details</div>
                </div>
              </div>
              
              <div className={`${styles.step} ${activeStep >= 2 ? styles.active : ''}`}>
                <div className={styles.stepNumber}>2</div>
                <div className={styles.stepInfo}>
                  <div className={styles.stepTitle}>Upload Evidence</div>
                  <div className={styles.stepDescription}>Add images and files</div>
                </div>
              </div>
              
              <div className={`${styles.step} ${activeStep >= 3 ? styles.active : ''}`}>
                <div className={styles.stepNumber}>3</div>
                <div className={styles.stepInfo}>
                  <div className={styles.stepTitle}>Review & Submit</div>
                  <div className={styles.stepDescription}>Final verification</div>
                </div>
              </div>
            </div>
            
            <div className={styles.panelFooter}>
              <div className={styles.supportInfo}>
                <div className={styles.supportIcon}>
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 10H8.01M12 10H12.01M16 10H16.01M9 16H5C3.89543 16 3 15.1046 3 14V6C3 4.89543 3.89543 4 5 4H19C20.1046 4 21 4.89543 21 6V14C21 15.1046 20.1046 16 19 16H14L9 21V16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className={styles.supportText}>
                  <div className={styles.supportTitle}>Need Help?</div>
                  <div className={styles.supportDescription}>Click to read more</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.mainPanel}>
          <div className={styles.formContainer}>
            <div className={styles.formHeader}>
              <h1 className={styles.title}>Testimony Addition</h1>
              <p className={styles.subtitle}>Complete all sections to submit your evidence securely</p>
            </div>

            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill} 
                style={{ width: `${(activeStep / 3) * 100}%` }}
              ></div>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className={styles.form}>
              {activeStep === 1 && (
                <div className={styles.formStep}>
                  <div className={styles.stepHeader}>
                    <h2 className={styles.stepTitle1}>Testimony Information</h2>
                    <p className={styles.stepDescription1}>Provide the basic details about your evidence submission</p>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="heading" className={styles.label}>
                      <span className={styles.labelText}> Heading</span>
                      <span className={styles.required}>*</span>
                    </label>
                    <div className={styles.inputContainer}>
                      <div className={styles.inputIcon}>
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M13 16H7M11 8H7M7 12H17M7 4H17C18.1046 4 19 4.89543 19 6V18C19 19.1046 18.1046 20 17 20H7C5.89543 20 5 19.1046 5 18V6C5 4.89543 5.89543 4 7 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </div>
                      <input
                        type="text"
                        id="heading"
                        name="heading"
                        value={formData.heading}
                        onChange={handleInputChange}
                        className={styles.input}
                        placeholder="Enter a compelling heading for your case"
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="role" className={styles.label}>
                      <span className={styles.labelText}> Role</span>
                      <span className={styles.required}>*</span>
                    </label>
                    <div className={styles.inputContainer}>
                      <div className={styles.inputIcon}>
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" strokeWidth="2"/>
                          <path d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      </div>
                      <input
                        type="text"
                        id="role"
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        className={styles.input}
                        placeholder="Enter role or position"
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="description" className={styles.label}>
                      <span className={styles.labelText}> Description</span>
                      <span className={styles.required}>*</span>
                    </label>
                    <div className={styles.textareaContainer}>
                      <div className={styles.textareaIcon}>
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M9 12H15M9 16H15M9 20H17C18.1046 20 19 19.1046 19 18V6C19 4.89543 18.1046 4 17 4H7C5.89543 4 5 4.89543 5 6V18C5 19.1046 5.89543 20 7 20H9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </div>
                      <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        className={styles.textarea}
                        placeholder="Provide a detailed description of evidence, including dates, locations, and relevant context..."
                        rows="5"
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.stepActions}>
                    <button
                      type="button"
                      onClick={nextStep}
                      className={styles.nextButton}
                    >
                      Continue
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {activeStep === 2 && (
                <div className={styles.formStep}>
                  <div className={styles.stepHeader}>
                    <h2 className={styles.stepTitle}>Upload Evidence</h2>
                    <p className={styles.stepDescription}>Add supporting images and documents to strengthen your case</p>
                  </div>
                  
                  <div className={styles.uploadGrid}>
                    <div className={styles.uploadSection}>
                      <div className={styles.uploadHeader}>
                        <div className={styles.uploadIcon}>
                          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 16L8.586 11.414C8.96106 11.0391 9.46967 10.8284 10 10.8284C10.5303 10.8284 11.0389 11.0391 11.414 11.414L16 16M14 14L15.586 12.414C15.9611 12.0391 16.4697 11.8284 17 11.8284C17.5303 11.8284 18.0389 12.0391 18.414 12.414L20 14M14 8H14.01M6 20H18C19.1046 20 20 19.1046 20 18V6C20 4.89543 19.1046 4 18 4H6C4.89543 4 4 4.89543 4 6V18C4 19.1046 4.89543 20 6 20Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <div className={styles.uploadInfo}>
                          <h3 className={styles.uploadTitle}>Profile Image</h3>
                          <p className={styles.uploadSubtitle}> identification photo</p>
                        </div>
                      </div>

                      <input
                        ref={profileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageChange(e, 'profile')}
                        className={styles.fileInput}
                      />

                      {profilePreview ? (
                        <div className={styles.previewContainer}>
                          <img
                            src={profilePreview}
                            alt="Profile preview"
                            className={styles.previewImage}
                          />
                          <div className={styles.previewOverlay}>
                            <button
                              type="button"
                              onClick={() => removeImage('profile')}
                              className={styles.previewAction}
                            >
                              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className={styles.uploadArea}
                          onClick={() => triggerFileInput('profile')}
                        >
                          <div className={styles.uploadContent}>
                            <div className={styles.uploadPlaceholderIcon}>
                              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 16V8M9 12H15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              </svg>
                            </div>
                            <div className={styles.uploadText}>
                              <p className={styles.uploadPrompt}>Click to upload profile image</p>
                              <span className={styles.uploadHint}>PNG, JPG up to 5MB</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className={styles.uploadSection}>
                      <div className={styles.uploadHeader}>
                        <div className={styles.uploadIcon}>
                          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 12H15M9 16H15M10 8H8C6.89543 8 6 8.89543 6 10V16C6 17.1046 6.89543 18 8 18H16C17.1046 18 18 17.1046 18 16V10C18 8.89543 17.1046 8 16 8H14M10 8C10 6.89543 10.8954 6 12 6C13.1046 6 14 6.89543 14 8M10 8C10 9.10457 10.8954 10 12 10C13.1046 10 14 9.10457 14 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </div>
                        <div className={styles.uploadInfo}>
                          <h3 className={styles.uploadTitle}>Evidence Image</h3>
                          <p className={styles.uploadSubtitle}>Supporting Image</p>
                        </div>
                      </div>

                      <input
                        ref={evidenceInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageChange(e, 'evidence')}
                        className={styles.fileInput}
                      />

                      {evidencePreview ? (
                        <div className={styles.previewContainer}>
                          <img
                            src={evidencePreview}
                            alt="Evidence preview"
                            className={styles.previewImage}
                          />
                          <div className={styles.previewOverlay}>
                            <button
                              type="button"
                              onClick={() => removeImage('evidence')}
                              className={styles.previewAction}
                            >
                              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className={styles.uploadArea}
                          onClick={() => triggerFileInput('evidence')}
                        >
                          <div className={styles.uploadContent}>
                            <div className={styles.uploadPlaceholderIcon}>
                              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 16V8M9 12H15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              </svg>
                            </div>
                            <div className={styles.uploadText}>
                              <p className={styles.uploadPrompt}>Click to upload evidence</p>
                              <span className={styles.uploadHint}>PNG, JPG up to 5MB</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles.stepActions}>
                    <button
                      type="button"
                      onClick={prevStep}
                      className={styles.backButton}
                    >
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={nextStep}
                      className={styles.nextButton}
                    >
                      Review Submission
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {activeStep === 3 && (
                <div className={styles.formStep}>
                  <div className={styles.stepHeader}>
                    <h2 className={styles.stepTitle}>Review & Submit</h2>
                    <p className={styles.stepDescription}>Verify your information before submitting</p>
                  </div>
                  
                  <div className={styles.reviewSection}>
                    <div className={styles.reviewCard}>
                      <h3 className={styles.reviewTitle}> Details</h3>
                      <div className={styles.reviewContent}>
                        <div className={styles.reviewItem}>
                          <span className={styles.reviewLabel}>Heading:</span>
                          <span className={styles.reviewValue}>{formData.heading || 'Not provided'}</span>
                        </div>
                        <div className={styles.reviewItem}>
                          <span className={styles.reviewLabel}>Role:</span>
                          <span className={styles.reviewValue}>{formData.role || 'Not provided'}</span>
                        </div>
                        <div className={styles.reviewItem}>
                          <span className={styles.reviewLabel}>Description:</span>
                          <span className={styles.reviewValue}>{formData.description || 'Not provided'}</span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.reviewCard}>
                      <h3 className={styles.reviewTitle}>Uploaded Files</h3>
                      <div className={styles.reviewContent}>
                        <div className={styles.reviewItem}>
                          <span className={styles.reviewLabel}>Profile Image:</span>
                          <span className={styles.reviewValue}>{profileImage ? 'Uploaded' : 'Not provided'}</span>
                        </div>
                        <div className={styles.reviewItem}>
                          <span className={styles.reviewLabel}>Evidence Image:</span>
                          <span className={styles.reviewValue}>{evidenceImage ? 'Uploaded' : 'Not provided'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.stepActions}>
                    <button
                      type="button"
                      onClick={prevStep}
                      className={styles.backButton}
                    >
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Back
                    </button>
                    <button
                      type="submit"
                      className={`${styles.submitButton} ${isSubmitting ? styles.submitting : ''}`}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <div className={styles.spinner}></div>
                          Processing Submission...
                        </>
                      ) : (
                        <>
                          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Submit Evidence
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      <ActionToast
        show={toast.show}
        type={toast.type}
        message={toast.message}
      />
    </div>
  );
};

export default EvidenceForm;