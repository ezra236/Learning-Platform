// components/CampaignRow.jsx
import React, { useState } from "react";
import styles from "./CampaignRow.module.css";

export default function CampaignRow({ onSubmit, loading }) {
  const [heading, setHeading] = useState("");
  const [description, setDescription] = useState("");
  const [format, setFormat] = useState("none");
  const [link, setLink] = useState("");
  const [file, setFile] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  function handleFile(e) {
    const f = e.target.files[0];
    setFile(f || null);
    if (f && f.type.startsWith("video")) setFormat("video");
    if (f && f.type.startsWith("image")) setFormat("image");
  }

  function submit(e) {
    e.preventDefault();
    onSubmit({ heading, description, format, link, file });
    // Reset form
    setHeading("");
    setDescription("");
    setFormat("none");
    setLink("");
    setFile(null);
    setIsExpanded(false);
  }

  return (
    <div className={`${styles.card} ${isExpanded ? styles.expanded : ''}`}>
      <div 
        className={styles.cardHeader}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className={styles.headerContent}>
          <div className={styles.iconWrapper}>
            <div className={styles.plusIconContainer}>
              <span className={`${styles.plusIcon} ${isExpanded ? styles.expanded : ''}`}>
                {isExpanded ? '−' : '+'}
              </span>
            </div>
          </div>
          <div className={styles.headerText}>
            <h3 className={styles.title}>Create New Campaign</h3>
            <p className={styles.subtitle}>Design and launch your marketing campaign</p>
          </div>
        </div>
        <div className={`${styles.arrow} ${isExpanded ? styles.expanded : ''}`}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </div>

      <form 
        className={`${styles.form} ${isExpanded ? styles.formVisible : ''}`}
        onSubmit={submit}
      >
        <div className={styles.formGrid}>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Campaign Heading
              <span className={styles.required}>*</span>
            </label>
            <div className={styles.inputContainer}>
              <input 
                className={styles.input}
                required 
                value={heading} 
                onChange={(e) => setHeading(e.target.value)} 
                placeholder="Enter campaign title..."
              />
              <div className={styles.inputIcon}>
                <div className={styles.iconInner}>🎯</div>
              </div>
              <div className={styles.inputFocus}></div>
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Description</label>
            <div className={styles.inputContainer}>
              <textarea 
                className={styles.textarea}
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your campaign goals and message..."
                rows="3"
              />
              <div className={styles.inputIcon}>
                <div className={styles.iconInner}>📝</div>
              </div>
              <div className={styles.inputFocus}></div>
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>External Link</label>
            <div className={styles.inputContainer}>
              <input 
                className={styles.input}
                type="url"
                value={link} 
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://example.com"
              />
              <div className={styles.inputIcon}>
                <div className={styles.iconInner}>🔗</div>
              </div>
              <div className={styles.inputFocus}></div>
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Media Type</label>
            <div className={styles.radioGroup}>
              <label className={`${styles.radioLabel} ${format === "none" ? styles.checked : ''}`}>
                <input
                  type="radio"
                  value="none"
                  checked={format === "none"}
                  onChange={(e) => setFormat(e.target.value)}
                />
                <span className={styles.radioCustom}></span>
                <span className={styles.radioText}>
                  <span className={styles.radioIcon}>
                    <div className={styles.radioIconInner}>🚫</div>
                  </span>
                  No Media
                </span>
                <span className={styles.radioHover}></span>
              </label>
              <label className={`${styles.radioLabel} ${format === "image" ? styles.checked : ''}`}>
                <input
                  type="radio"
                  value="image"
                  checked={format === "image"}
                  onChange={(e) => setFormat(e.target.value)}
                />
                <span className={styles.radioCustom}></span>
                <span className={styles.radioText}>
                  <span className={styles.radioIcon}>
                    <div className={styles.radioIconInner}>🖼️</div>
                  </span>
                  Image
                </span>
                <span className={styles.radioHover}></span>
              </label>
              <label className={`${styles.radioLabel} ${format === "video" ? styles.checked : ''}`}>
                <input
                  type="radio"
                  value="video"
                  checked={format === "video"}
                  onChange={(e) => setFormat(e.target.value)}
                />
                <span className={styles.radioCustom}></span>
                <span className={styles.radioText}>
                  <span className={styles.radioIcon}>
                    <div className={styles.radioIconInner}>🎥</div>
                  </span>
                  Video
                </span>
                <span className={styles.radioHover}></span>
              </label>
            </div>
          </div>

          {(format === "image" || format === "video") && (
            <div className={`${styles.fieldGroup} ${styles.fileField}`}>
              <label className={styles.label}>
                Upload {format === "image" ? "Image" : "Video"}
              </label>
              <div className={styles.fileUpload}>
                <input 
                  type="file" 
                  accept={format === "image" ? "image/*" : "video/*"} 
                  onChange={handleFile}
                  className={styles.fileInput}
                />
                <div className={styles.fileDisplay}>
                  <div className={styles.fileIcon}>
                    <div className={styles.fileIconInner}>
                      {file ? (format === "image" ? "🖼️" : "🎥") : "📁"}
                    </div>
                  </div>
                  <div className={styles.fileInfo}>
                    {file ? (
                      <>
                        <span className={styles.fileName}>{file.name}</span>
                        <span className={styles.fileSize}>
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </>
                    ) : (
                      <div>
                        <div className={styles.filePlaceholder}>Choose file...</div>
                        <div className={styles.fileHint}>
                          {format === "image" ? "PNG, JPG, GIF up to 10MB" : "MP4, MOV up to 50MB"}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className={styles.fileButton}>
                    <span className={styles.fileButtonText}>Browse</span>
                    <div className={styles.fileButtonHover}></div>
                  </div>
                  <div className={styles.fileUploadEffect}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <button 
            type="button"
            className={styles.cancelBtn}
            onClick={() => setIsExpanded(false)}
          >
            <span className={styles.cancelText}>Cancel</span>
            <div className={styles.cancelHover}></div>
          </button>
          <button 
            type="submit" 
            disabled={loading}
            className={`${styles.submitBtn} ${loading ? styles.loading : ''}`}
          >
            <div className={styles.submitBackground}></div>
            <span className={styles.btnContent}>
              {loading ? (
                <>
                  <span className={styles.spinner}></span>
                  Creating Campaign...
                </>
              ) : (
                <>
                  <span className={styles.btnIcon}>
                    <div className={styles.btnIconInner}>✨</div>
                  </span>
                  Create Campaign
                </>
              )}
            </span>
            <div className={styles.submitHover}></div>
          </button>
        </div>
      </form>
    </div>
  );
}