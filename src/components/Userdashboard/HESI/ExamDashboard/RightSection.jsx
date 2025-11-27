'use client';

import React, { useEffect, useState, useRef } from 'react';
import styles from './RightSection.module.css';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export default function RightSection() {
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState({ start: [], attempted: [], completed: [] });
  const [totals, setTotals] = useState(null);
  const [error, setError] = useState(null);
  const [btnLoading, setBtnLoading] = useState({});
  const [activeFilter, setActiveFilter] = useState('start');
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const router = useRouter();
  const debounceRef = useRef(null);

  async function fetchDashboard(q = '') {
    setLoading(true);
    setError(null);
    try {
      const url = q ? `${API_BASE}/api/user/hesi-dashboard/?q=${encodeURIComponent(q)}` : `${API_BASE}/api/user/hesi-dashboard/`;
      const res = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Accept': 'application/json' },
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`API error ${res.status}: ${txt}`);
      }
      const data = await res.json();
      setGroups(data.groups || { start: [], attempted: [], completed: [] });
      setTotals(data.totals || {});
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load exams');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchDashboard(query.trim());
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function handleModeClick(exam, mode) {
    const key = `${exam.id}_${mode}`;
    setBtnLoading((s) => ({ ...s, [key]: true }));
    const encoded = encodeURIComponent(exam.name);
    router.push(`/user/hesi/${mode}/${encoded}`);
  }

  const currentList = groups[activeFilter] || [];

  // Sort exams
  const sortedExams = [...currentList].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'progress':
        return b.progress - a.progress;
      case 'questions':
        return b.total_questions - a.total_questions;
      default:
        return 0;
    }
  });

  const getModeIcon = (mode) => {
    switch(mode) {
      case 'reviewmode': return '📖';
      case 'tutormode': return '👨‍🏫';
      case 'exammode': return '📝';
      default: return '🎯';
    }
  };

  const getModeColor = (mode) => {
    switch(mode) {
      case 'reviewmode': return '#4f86f7';
      case 'tutormode': return '#b41459ff';
      case 'exammode': return '#38a169';
      default: return '#718096';
    }
  };

  const getFilterIcon = (filter) => {
    switch(filter) {
      case 'start': return '🆕';
      case 'attempted': return '🔄';
      case 'completed': return '✅';
      default: return '📚';
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return '#38a169';
    if (progress >= 50) return '#d69e2e';
    if (progress >= 25) return '#ed8936';
    return '#e53e3e';
  };

  const displayModeText = (mode) => {
    if (!mode) return '';
    return mode.charAt(0).toUpperCase() + mode.slice(1);
  };

  return (
    <div className={styles.wrapper}>
      {/* Header Section */}
      <header className={styles.header}>
        <div className={styles.welcomeSection}>
          <div className={styles.welcomeContent}>
            <h1 className={styles.welcomeTitle}>
              HESI A2 Dashboard
            </h1>
            <p className={styles.welcomeSubtitle}>
              Track your progress, continue learning, and achieve your goals
            </p>
          </div>
          <div className={styles.welcomeStats}>
            <div className={styles.welcomeStat}>
              <span className={styles.welcomeStatIcon}>⭐</span>
              <div className={styles.welcomeStatContent}>
                <div className={styles.welcomeStatNumber}>{totals?.total_exams_completed || 0}</div>
                <div className={styles.welcomeStatLabel}>Completed</div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.controlsSection}>
          <div className={styles.searchContainer}>
            <div className={styles.searchBox}>
              <span className={styles.searchIcon}>🔍</span>
              <input
                type="search"
                placeholder="Search exams by name..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className={styles.searchInput}
              />
              {query && (
                <button 
                  onClick={() => setQuery('')} 
                  className={styles.clearBtn}
                  aria-label="Clear search"
                >
                  <span className={styles.clearIcon}>✕</span>
                </button>
              )}
            </div>
          </div>

          <div className={styles.sortContainer}>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className={styles.sortSelect}
            >
              <option value="name">Sort by Name</option>
              <option value="progress">Sort by Progress</option>
              <option value="questions">Sort by Questions</option>
            </select>
          </div>
        </div>
      </header>

      {/* Stats Overview */}
      <section className={styles.statsOverview}>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIconWrapper} style={{ background: 'linear-gradient(135deg, #6b7ff7 0%, #7c53c4 100%)' }}>
              <span className={styles.statIcon}>📚</span>
            </div>
            <div className={styles.statContent}>
              <div className={styles.statNumber}>{totals?.total_exams ?? 0}</div>
              <div className={styles.statLabel}>Total Exams</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIconWrapper} style={{ background: 'linear-gradient(135deg, #ff8a8a 0%, #ff5e7d 100%)' }}>
              <span className={styles.statIcon}>✍️</span>
            </div>
            <div className={styles.statContent}>
              <div className={styles.statNumber}>{totals?.total_exams_attempted ?? 0}</div>
              <div className={styles.statLabel}>In Progress</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIconWrapper} style={{ background: 'linear-gradient(135deg, #4fd1c7 0%, #38b2ac 100%)' }}>
              <span className={styles.statIcon}>✅</span>
            </div>
            <div className={styles.statContent}>
              <div className={styles.statNumber}>{totals?.total_exams_completed ?? 0}</div>
              <div className={styles.statLabel}>Completed</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIconWrapper} style={{ background: 'linear-gradient(135deg, #68d391 0%, #48bb78 100%)' }}>
              <span className={styles.statIcon}>❓</span>
            </div>
            <div className={styles.statContent}>
              <div className={styles.statNumber}>{totals?.total_questions ?? 0}</div>
              <div className={styles.statLabel}>Total Questions</div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Tabs */}
      <section className={styles.filterSection}>
        <div className={styles.filterTabs}>
          <button
            className={`${styles.filterTab} ${activeFilter === 'start' ? styles.filterTabActive : ''}`}
            onClick={() => setActiveFilter('start')}
          >
            <span className={styles.tabIcon}>{getFilterIcon('start')}</span>
            Start New
            <span className={styles.tabBadge}>{groups.start?.length || 0}</span>
          </button>
          <button
            className={`${styles.filterTab} ${activeFilter === 'attempted' ? styles.filterTabActive : ''}`}
            onClick={() => setActiveFilter('attempted')}
          >
            <span className={styles.tabIcon}>{getFilterIcon('attempted')}</span>
            In Progress
            <span className={styles.tabBadge}>{groups.attempted?.length || 0}</span>
          </button>
          <button
            className={`${styles.filterTab} ${activeFilter === 'completed' ? styles.filterTabActive : ''}`}
            onClick={() => setActiveFilter('completed')}
          >
            <span className={styles.tabIcon}>{getFilterIcon('completed')}</span>
            Completed
            <span className={styles.tabBadge}>{groups.completed?.length || 0}</span>
          </button>
        </div>
      </section>

      {/* Exams Grid */}
      <main className={styles.mainContent}>
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.loadingAnimation}>
              <div className={styles.loadingSpinner}></div>
            </div>
            <div className={styles.loadingText}>Loading your exams...</div>
            <div className={styles.loadingSubtext}>Preparing your learning journey</div>
          </div>
        ) : error ? (
          <div className={styles.errorState}>
            <span className={styles.errorIcon}>⚠️</span>
            <div className={styles.errorTitle}>Something went wrong</div>
            <div className={styles.errorText}>{error}</div>
            <button onClick={() => fetchDashboard()} className={styles.retryButton}>
              <span className={styles.retryIcon}>🔄</span>
              Try Again
            </button>
          </div>
        ) : sortedExams.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>📭</span>
            <div className={styles.emptyTitle}>No exams found</div>
            <div className={styles.emptyText}>
              {query ? `No exams match "${query}" in ${activeFilter}` : `No exams in "${activeFilter}"`}
            </div>
            {query && (
              <button onClick={() => setQuery('')} className={styles.clearSearchButton}>
                Clear search
              </button>
            )}
          </div>
        ) : (
          <>
            <div className={styles.resultsInfo}>
              <span className={styles.resultsCount}>
                Showing {sortedExams.length} exam{sortedExams.length !== 1 ? 's' : ''}
                {query && ` for "${query}"`}
              </span>
              <span className={styles.resultsFilter}>Filtered by: {activeFilter}</span>
            </div>
            
            <div className={styles.examsGrid}>
              {sortedExams.map((exam) => (
                <div className={styles.examCard} key={exam.id}>
                  <div className={styles.cardHeader}>
                    <div className={styles.examInfo}>
                      <h3 className={styles.examName}>{exam.name}</h3>
                    </div>
                    <div className={styles.examStatus} data-status={activeFilter}>
                      {activeFilter === 'start' && '🆕'}
                      {activeFilter === 'attempted' && '🔄'}
                      {activeFilter === 'completed' && '✅'}
                    </div>
                  </div>

                  <div className={styles.cardBody}>
                    <div className={styles.progressSection}>
                      <div className={styles.progressHeader}>
                        <span className={styles.progressLabel}>Progress</span>
                        <span 
                          className={styles.progressPercent}
                          style={{ color: getProgressColor(exam.progress) }}
                        >
                          {exam.progress}%
                        </span>
                      </div>
                      <div className={styles.progressBar}>
                        <div 
                          className={styles.progressFill} 
                          style={{ 
                            width: `${exam.progress}%`,
                            background: `linear-gradient(90deg, ${getProgressColor(exam.progress)}, ${getProgressColor(exam.progress)}99)`
                          }}
                        ></div>
                      </div>
                    </div>

                    <div className={styles.statsGrid}>
                      <div className={styles.statItem}>
                        <span className={styles.statIcon}>📊</span>
                        <div className={styles.statInfo}>
                          <div className={styles.statValue}>{exam.total_questions}</div>
                          <div className={styles.statLabel}>Total Questions</div>
                        </div>
                      </div>
                      <div className={styles.statItem}>
                        <span className={styles.statIcon}>🎯</span>
                        <div className={styles.statInfo}>
                          <div className={styles.statValue}>{exam.questions_attempted}</div>
                          <div className={styles.statLabel}>Attempted</div>
                        </div>
                      </div>
                    </div>

                    <div className={styles.actionsGrid}>
                      {['reviewmode', 'tutormode', 'exammode'].map((mode) => {
                        const key = `${exam.id}_${mode}`;
                        const isLoading = !!btnLoading[key];
                        return (
                          <button
                            key={mode}
                            className={styles.modeButton}
                            style={{ '--button-color': getModeColor(mode) }}
                            onClick={() => handleModeClick(exam, mode)}
                            disabled={isLoading}
                          >
                            <span className={styles.buttonIcon}>
                              {isLoading ? (
                                <div className={styles.buttonSpinner}></div>
                              ) : (
                                getModeIcon(mode)
                              )}
                            </span>
                            <span className={styles.buttonText}>
                              {isLoading ? 'Loading...' : displayModeText(mode)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
