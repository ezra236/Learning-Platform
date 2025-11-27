import React, { useState, useEffect } from 'react';
import styles from './EditExam.module.css';
import { fetchCsrf } from '@/lib/nclexHelpers';

export default function EditExamForm({ exam, onUpdated }) {
  const [name, setName] = useState(exam?.name || '');
  const [duration, setDuration] = useState(exam?.duration_minutes || 60);
  const [isCompleted, setIsCompleted] = useState(exam?.is_completed || false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (exam) {
      setName(exam.name);
      setDuration(exam.duration_minutes);
      setIsCompleted(exam.is_completed);
    }
  }, [exam]);

  async function patchExam(changes) {
    if (!exam) return;
    setLoading(true);
    await fetchCsrf();
    const csrftoken = (document.cookie.match(/csrftoken=([^;]+)/) || [])[1] || '';
    const resp = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/nclex/exams/${exam.id}/`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrftoken,
      },
      body: JSON.stringify(changes),
    });
    const data = await resp.json();
    setLoading(false);
    if (resp.ok) {
      if (onUpdated) onUpdated(data);
    } else {
      alert('❌ ' + JSON.stringify(data));
    }
  }

  const handleSave = (e) => {
    e.preventDefault();
    patchExam({ name, duration_minutes: Number(duration) });
  };

  const toggleCompleted = async () => {
    const newVal = !isCompleted;
    await patchExam({ is_completed: newVal });
    setIsCompleted(newVal);
  };

  return (
    <form className={styles.form} onSubmit={handleSave}>
      <div className={styles.formGrid}>
        <div className={styles.inputGroup}>
          <label className={styles.label}>
            <span className={styles.labelIcon}>📛</span>
            Exam Name
          </label>
          <input 
            className={styles.input} 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required 
            placeholder="Enter exam name..."
          />
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>
            <span className={styles.labelIcon}>⏱️</span>
            Duration (minutes)
          </label>
          <input
            className={styles.input}
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            min={1}
            placeholder="60"
          />
        </div>
      </div>

      <div className={styles.buttonGroup}>
        <button 
          className={`${styles.button} ${styles.primaryButton}`} 
          type="submit" 
          disabled={loading}
        >
          {loading ? (
            <>
              <span className={styles.spinner}></span>
              Saving...
            </>
          ) : (
            <>
              💾 Save Changes
            </>
          )}
        </button>

        <button
          type="button"
          className={`${styles.button} ${isCompleted ? styles.warningButton : styles.successButton}`}
          onClick={toggleCompleted}
          disabled={loading}
        >
          {isCompleted ? (
            <>↶ Unmark Completed</>
          ) : (
            <>✅ Mark Completed</>
          )}
        </button>
      </div>
    </form>
  );
}