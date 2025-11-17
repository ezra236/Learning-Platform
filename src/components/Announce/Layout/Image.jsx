import React, { useRef, useState } from 'react'
import styles from './Image.module.css'
import SuccessToast from './Success'
import ErrorToast from './Error'

function getCookie(name) {
  if (typeof document === 'undefined') return null
  const cookieValue = document.cookie
    .split('; ')
    .find(row => row.startsWith(name + '='))
  return cookieValue ? decodeURIComponent(cookieValue.split('=')[1]) : null
}

async function ensureCsrfCookie(apiBase) {
  try {
    await fetch(`${apiBase}/api/csrf/`, {
      credentials: 'include',
    })
  } catch (err) {
    console.warn('ensureCsrfCookie error', err)
  }
}

export default function Image({ onUploadComplete }) {
  const [image, setImage] = useState(null)
  const [file, setFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [toast, setToast] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef(null)

  const handleFileChange = (event) => {
    const f = event.target.files[0]
    if (f && f.type.startsWith('image/')) {
      setFile(f)
      const reader = new FileReader()
      reader.onload = (e) => setImage(e.target.result)
      reader.readAsDataURL(f)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files[0]
    if (f && f.type.startsWith('image/')) {
      setFile(f)
      const reader = new FileReader()
      reader.onload = (e) => setImage(e.target.result)
      reader.readAsDataURL(f)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const removeImage = (e) => {
    e.stopPropagation()
    setImage(null)
    setFile(null)
  }

  const uploadAnnouncement = async () => {
    if (isUploading) return
    if (!file) {
      setToast({ type: 'error', message: 'Please select an image file' })
      return
    }

    setIsUploading(true)
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || ''
    try {
      await ensureCsrfCookie(apiBase)
      const csrftoken = getCookie('csrftoken')

      const fd = new FormData()
      fd.append('file', file)
      fd.append('format', 'image')

      const res = await fetch(`${apiBase}/api/announcements/upload/`, {
        method: 'POST',
        body: fd,
        credentials: 'include',
        headers: {
          'X-CSRFToken': csrftoken || '',
        },
      })

      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setToast({ type: 'success', message: 'Image announcement created successfully' })
        setImage(null)
        setFile(null)
        if (onUploadComplete) {
          setTimeout(onUploadComplete, 1500)
        }
      } else {
        const errMsg = data.detail || data.error || 'Upload failed. Please try again.'
        setToast({ type: 'error', message: errMsg })
      }
    } catch (err) {
      setToast({ type: 'error', message: 'Network error. Please check your connection.' })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className={styles.container}>
      {toast && toast.type === 'success' && (
        <SuccessToast message={toast.message} onClose={() => setToast(null)} />
      )}
      {toast && toast.type === 'error' && (
        <ErrorToast message={toast.message} onClose={() => setToast(null)} />
      )}

      <div className={styles.uploadContainer}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className={styles.fileInput}
        />

        {!image ? (
          <div
            className={`${styles.uploadArea} ${isDragging ? styles.dragging : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
          >
            <div className={styles.uploadContent}>
              <div className={styles.uploadIcon}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                  <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3Z" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M8.5 10C9.32843 10 10 9.32843 10 8.5C10 7.67157 9.32843 7 8.5 7C7.67157 7 7 7.67157 7 8.5C7 9.32843 7.67157 10 8.5 10Z" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M21 15L16 10L5 21" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              </div>
              <h3 className={styles.uploadTitle}>Upload Image</h3>
              <p className={styles.uploadDescription}>
                Drag and drop your image here or click to browse files
              </p>
              <div className={styles.specs}>
                <div className={styles.specItem}>
                  <div className={styles.specIcon}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3Z"/>
                    </svg>
                  </div>
                  <span>1:1 Square Ratio</span>
                </div>
                <div className={styles.specItem}>
                  <div className={styles.specIcon}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM6 20V4H13V9H18V20H6Z"/>
                    </svg>
                  </div>
                  <span>JPG, PNG, WEBP</span>
                </div>
              </div>
              <button className={styles.browseButton}>
                Select Image File
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.previewContainer}>
            <div className={styles.previewCard}>
              <div className={styles.previewHeader}>
                <h3 className={styles.previewTitle}>Image Preview</h3>
                <div className={styles.previewStatus}>
                  <div className={styles.statusIndicator}></div>
                  Ready to upload
                </div>
              </div>

              <div className={styles.imagePreview}>
                <img src={image} alt="Preview" className={styles.previewImage} />
                <div className={styles.imageOverlay}>
                  <button className={styles.removeButton} onClick={removeImage}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                  </button>
                </div>
              </div>

              <div className={styles.previewInfo}>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>File Format</span>
                    <span className={styles.infoValue}>{file?.type.split('/')[1]?.toUpperCase()}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>File Size</span>
                    <span className={styles.infoValue}>
                      {file ? Math.round(file.size / 1024) : 0} KB
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Dimensions</span>
                    <span className={styles.infoValue}>Square (1:1)</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Status</span>
                    <span className={styles.infoValue}>Ready</span>
                  </div>
                </div>
              </div>

              <div className={styles.previewActions}>
                <button
                  className={styles.uploadButton}
                  onClick={uploadAnnouncement}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <div className={styles.buttonSpinner}></div>
                      Creating Announcement...
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                      </svg>
                      Create Image Announcement
                    </>
                  )}
                </button>
                <button 
                  className={styles.secondaryButton}
                  onClick={handleClick}
                  disabled={isUploading}
                >
                  Choose Different Image
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}