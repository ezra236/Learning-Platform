import React, { useState } from 'react';
import authFetch from './api';
import styles from './ReportModal.module.css';

export default function ReportModal({ question, exam, onClose, onSuccess }) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!message.trim()) {
      alert('Please provide a reason for reporting this question.');
      return;
    }

    setLoading(true);
    try {
      await authFetch('/nclex/reports/', { method: 'POST', body: { question: question.id, exam: exam.id, message }});
      onSuccess && onSuccess();
    } catch (e) {
      alert('Report failed: ' + e.message);
    } finally { setLoading(false); }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <span className={styles.headerIcon}>🚩</span>
          <h3 className={styles.title}>Report Question</h3>
        </div>

        <div className={styles.questionPreview}>
          <div className={styles.questionLabel}>
            <span>📋</span>
            Question Preview:
          </div>
          <div 
            className={styles.questionText}
            dangerouslySetInnerHTML={{ __html: question.question_text }} 
          />
        </div>

        <textarea 
          rows={6} 
          value={message} 
          onChange={(e) => setMessage(e.target.value)}
          className={styles.textarea}
          placeholder="Please describe the issue with this question (typo, incorrect answer, unclear content, etc.)..."
        />

        <div className={styles.footer}>
          <button 
            onClick={onClose}
            className={`${styles.button} ${styles.buttonCancel}`}
            disabled={loading}
          >
            ❌ Cancel
          </button>
          <button 
            onClick={submit} 
            disabled={loading}
            className={`${styles.button} ${styles.buttonSubmit}`}
          >
            {loading ? '⏳ Sending...' : '📤 Send Report'}
          </button>
        </div>
      </div>
    </div>
  );
}