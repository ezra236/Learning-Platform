import React, { useState, useEffect } from 'react';
import styles from './LeftSection.module.css';

const LeftSection = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const csrfResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/csrf/`, {
        credentials: 'include',
      });
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/newsletter/subscribers/`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('🚫 Failed to fetch subscribers');
      }

      const data = await response.json();
      setSubscribers(data.subscribers);
      setCount(data.count);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}>⏳</div>
        <p>Loading subscribers...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h2>📬 Subscriber List</h2>
          <div className={styles.countBadge}>
            <span className={styles.countIcon}>👥</span>
            {count} Subscribers
          </div>
        </div>
        <p className={styles.subtitle}>Manage your newsletter subscribers</p>
      </div>
      
      {error && (
        <div className={styles.error}>
          <span className={styles.errorIcon}>⚠️</span>
          {error}
        </div>
      )}

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📈</div>
          <div className={styles.statInfo}>
            <div className={styles.statNumber}>{count}</div>
            <div className={styles.statLabel}>Total</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>🆕</div>
          <div className={styles.statInfo}>
            <div className={styles.statNumber}>
              {subscribers.filter(sub => {
                const subDate = new Date(sub.created_at);
                const today = new Date();
                return subDate.toDateString() === today.toDateString();
              }).length}
            </div>
            <div className={styles.statLabel}>Today</div>
          </div>
        </div>
      </div>

      <div className={styles.subscribersContainer}>
        <div className={styles.subscribersHeader}>
          <span>📧 Email Address</span>
          <span>📅 Joined Date</span>
        </div>
        
        <div className={styles.subscribersList}>
          {subscribers.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📭</div>
              <h3>No subscribers yet</h3>
              <p>Subscribers will appear here once they sign up</p>
            </div>
          ) : (
            subscribers.map((subscriber, index) => (
              <div key={index} className={styles.subscriberItem}>
                <div className={styles.subscriberInfo}>
                  <span className={styles.emailIcon}>✉️</span>
                  <div className={styles.emailInfo}>
                    <div className={styles.email}>{subscriber.email}</div>
                    <div className={styles.subscriberId}>Subscriber #{index + 1}</div>
                  </div>
                </div>
                <div className={styles.dateInfo}>
                  <div className={styles.date}>{subscriber.created_at}</div>
                  <div className={styles.status}>Active ✅</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      <button 
        className={styles.refreshButton}
        onClick={fetchSubscribers}
        disabled={loading}
      >
        <span className={styles.refreshIcon}>🔄</span>
        Refresh List
      </button>
    </div>
  );
};

export default LeftSection;