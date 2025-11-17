// components/insights/Modal.jsx
"use client";

import React, { useEffect, useRef } from "react";
import styles from "./Modal.module.css";

export default function Modal({ children, onClose }) {
  const modalRef = useRef(null);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    
    function onClickOutside(e) {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    }
    
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClickOutside);
    document.body.style.overflow = "hidden";
    
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClickOutside);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className={styles.overlay}>
      <div 
        ref={modalRef}
        className={styles.inner}
      >
        <button 
          className={styles.closeBtn} 
          onClick={onClose} 
          aria-label="Close modal"
        >
          <span className={styles.closeIcon}>✕</span>
        </button>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}