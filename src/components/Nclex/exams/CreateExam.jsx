import React, { useState } from 'react';
import styles from './CreateExam.module.css';

async function fetchCsrf() {
  await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/csrf/`, {
    credentials: 'include',
  });
}

export default function CreateExam({ onCreated }) {
  const [name, setName] = useState('');
  const [duration, setDuration] = useState(60);
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    await fetchCsrf();

    const resp = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/nclex/exams/`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': (document.cookie.match(/csrftoken=([^;]+)/) || [])[1] || '',
      },
      body: JSON.stringify({ name, duration_minutes: Number(duration) }),
    });
    const json = await resp.json();
    setLoading(false);
    if (resp.ok) {
      setName('');
      setDuration(60);
      if (onCreated) onCreated(json);
    } else {
      alert(JSON.stringify(json));
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.icon}>📝</span>
        <h2 className={styles.title}>Create New Exam</h2>
      </div>
      
      <form className={styles.form} onSubmit={handleCreate}>
        <div className={styles.formGroup}>
          <label className={styles.label}>
            <span className={styles.labelText}>📋 Exam Name</span>
            <input 
              className={styles.input} 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Enter exam name..."
              required 
            />
          </label>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>
            <span className={styles.labelText}>⏱️ Duration (minutes)</span>
            <input
              className={styles.input}
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              min={1}
            />
          </label>
        </div>

        <button className={styles.button} type="submit" disabled={loading}>
          <span className={styles.buttonIcon}>
            {loading ? '⏳' : '✨'}
          </span>
          {loading ? 'Creating...' : 'Create Exam'}
        </button>
      </form>
    </div>
  );
}