// components/AtiProgress.jsx
import React, { useEffect, useState } from "react";
import styles from "./AtiProgress.module.css";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, ArcElement, Tooltip, Legend);

export default function AtiProgress() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      try {
        await fetch(`${base}/api/auth/csrf/`, { method: "GET", credentials: "include" });

        const res = await fetch(`${base}/api/progress/ati/`, {
          method: "GET",
          credentials: "include",
          headers: { "Accept": "application/json" },
        });

        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`Failed to fetch: ${res.status} ${txt}`);
        }
        const json = await res.json();
        if (mounted) {
          setData(json);
          setLoading(false);
        }
      } catch (err) {
        console.error("ATI progress fetch error", err);
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchData();
    return () => { mounted = false; };
  }, [base]);

  if (loading) return (
    <div className={styles.loading}>
      <div className={styles.loadingContent}>
        <div className={styles.spinnerContainer}>
          <div className={styles.spinner}>⟳</div>
        </div>
        <div className={styles.loadingTitle}>Loading ATI Progress</div>
        <div className={styles.loadingSubtitle}>Fetching your latest results</div>
        <div className={styles.loadingDots}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  );
  
  if (!data) return (
    <div className={styles.error}>
      <div className={styles.errorContent}>
        <div className={styles.errorIcon}>⚠️</div>
        <div className={styles.errorTitle}>Unable to load ATI progress</div>
        <div className={styles.errorSubtitle}>Please login to view your dashboard</div>
        <button className={styles.retryButton} onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    </div>
  );

  const exams = data.exams || [];
  const agg = data.aggregate || {};

  // bar chart: progress percent per exam
  const barLabels = exams.map(e => e.name);
  const barData = exams.map(e => e.progress_percent ?? 0);

  // pie: grade distribution with better colors
  const gd = agg.grade_distribution || {};
  const pieLabels = Object.keys(gd);
  const pieValues = pieLabels.map(l => gd[l]);

  const chartColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316', '#84CC16'];

  return (
    <div className={styles.container}>
      {/* Animated Background Elements */}
      <div className={styles.backgroundBlobs}>
        <div className={styles.blob1}></div>
        <div className={styles.blob2}></div>
        <div className={styles.blob3}></div>
      </div>

      <div className={styles.header}>
        <div className={styles.titleSection}>
          <div className={styles.titleWrapper}>
            <h2 className={styles.title}>
              <span className={styles.titleIcon}>🎯</span>
              ATI Progress 
            </h2>
            <div className={styles.titleBadge}>Active</div>
          </div>
          <div className={styles.lastUpdated}>
            <span className={styles.lastUpdatedIcon}>🕒</span>
            Last updated: Just now
          </div>
        </div>
        <div className={styles.headerStats}>
          <div className={styles.headerStat}>
            <div className={styles.headerStatValue}>{agg.exams_completed ?? 0}<span className={styles.statDivider}>/</span>{agg.exams_count ?? 0}</div>
            <div className={styles.headerStatLabel}>Exams Completed</div>
          </div>
          <div className={styles.headerProgress}>
            <div className={styles.progressCircle}>
              <svg viewBox="0 0 36 36" className={styles.circularChart}>
                <path className={styles.circleBg}
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path className={styles.circle}
                  strokeDasharray={`${((agg.exams_completed ?? 0) / (agg.exams_count ?? 1)) * 100}, 100`}
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className={styles.progressPercent}>
                {Math.round(((agg.exams_completed ?? 0) / (agg.exams_count ?? 1)) * 100)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className={styles.summary}>
        <div className={styles.card}>
          <div className={styles.cardGradient}></div>
          <div className={styles.cardIcon}>📚</div>
          <div className={styles.cardContent}>
            <div className={styles.metric}>{agg.exams_count ?? 0}</div>
            <div className={styles.label}>Total ATI Exams</div>
          </div>
          <div className={styles.cardSparkle}>✨</div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardGradient}></div>
          <div className={styles.cardIcon}>✅</div>
          <div className={styles.cardContent}>
            <div className={styles.metric}>{agg.exams_completed ?? 0}</div>
            <div className={styles.label}>Completed</div>
          </div>
          <div className={styles.cardSparkle}>✨</div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardGradient}></div>
          <div className={styles.cardIcon}>❓</div>
          <div className={styles.cardContent}>
            <div className={styles.metric}>{agg.total_questions_attempted ?? 0}</div>
            <div className={styles.label}>Questions Attempted</div>
          </div>
          <div className={styles.cardSparkle}>✨</div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardGradient}></div>
          <div className={styles.cardIcon}>⏱️</div>
          <div className={styles.cardContent}>
            <div className={styles.metric}>{formatTime(agg.total_time_spent_seconds ?? 0)}</div>
            <div className={styles.label}>Total Time Spent</div>
          </div>
          <div className={styles.cardSparkle}>✨</div>
        </div>
      </div>

      {/* Charts */}
      <div className={styles.chartsRow}>
        <div className={styles.chartBox}>
          <div className={styles.chartHeader}>
            <div className={styles.chartTitleWrapper}>
              <h3 className={styles.chartTitle}>
                <span className={styles.chartIcon}>📊</span>
                Progress Overview
              </h3>
              <div className={styles.chartBadge}>Live</div>
            </div>
            <div className={styles.chartSubtitle}>Completion percentage per exam</div>
          </div>
          <div className={styles.chartContainer}>
            <Bar
              data={{
                labels: barLabels,
                datasets: [
                  { 
                    label: "Progress %", 
                    data: barData, 
                    backgroundColor: barData.map((value, index) => 
                      `hsl(${210 + index * 30}, 80%, 60%)`
                    ),
                    borderColor: barData.map((value, index) => 
                      `hsl(${210 + index * 30}, 80%, 45%)`
                    ),
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false,
                  }
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: { 
                    beginAtZero: true, 
                    max: 100,
                    grid: { 
                      color: 'rgba(59, 130, 246, 0.1)',
                      drawBorder: false,
                    },
                    ticks: {
                      font: {
                        size: 11,
                      },
                      color: '#64748b',
                    }
                  },
                  x: {
                    grid: { display: false },
                    ticks: {
                      font: {
                        size: 11,
                      },
                      color: '#64748b',
                    }
                  }
                },
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleFont: { size: 12 },
                    bodyFont: { size: 11 },
                    padding: 12,
                    cornerRadius: 8,
                    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                  }
                }
              }}
            />
          </div>
        </div>

        <div className={styles.chartBox}>
          <div className={styles.chartHeader}>
            <div className={styles.chartTitleWrapper}>
              <h3 className={styles.chartTitle}>
                <span className={styles.chartIcon}>🥧</span>
                Grade Distribution
              </h3>
              <div className={styles.chartBadge}>Analysis</div>
            </div>
            <div className={styles.chartSubtitle}>Performance across all exams</div>
          </div>
          <div className={styles.chartContainer}>
            <Pie
              data={{
                labels: pieLabels,
                datasets: [{ 
                  data: pieValues,
                  backgroundColor: chartColors,
                  borderWidth: 3,
                  borderColor: '#fff',
                  hoverBorderWidth: 4,
                  hoverOffset: 8
                }],
              }}
              options={{ 
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      padding: 20,
                      usePointStyle: true,
                      pointStyle: 'circle',
                      font: {
                        size: 11,
                      },
                      color: '#64748b',
                    }
                  },
                  tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    bodyFont: { size: 11 },
                    padding: 12,
                    cornerRadius: 8,
                    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Exams List */}
      <div className={styles.list}>
        <div className={styles.listHeader}>
          <div className={styles.listTitleSection}>
            <h3 className={styles.listTitle}>
              <span className={styles.listIcon}>📝</span>
              Exam Details
            </h3>
            <div className={styles.listSubtitle}>Detailed breakdown of each exam</div>
          </div>
          <div className={styles.examCountWrapper}>
            <span className={styles.examCount}>{exams.length} exams</span>
            <div className={styles.examCountGlow}></div>
          </div>
        </div>
        
        {exams.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📖</div>
            <div className={styles.emptyContent}>
              <div className={styles.emptyTitle}>No ATI attempts yet</div>
              <div className={styles.emptySubtitle}>Start your first exam to see progress data</div>
            </div>
            <div className={styles.emptyAction}>Begin Learning →</div>
          </div>
        )}
        
        <div className={styles.examList}>
          {exams.map((e, index) => (
            <div key={e.exam_id} className={styles.examRow} style={{animationDelay: `${index * 0.1}s`}}>
              <div className={styles.examGlow}></div>
              <div className={styles.examIcon}>
                {e.completed ? '🎓' : '📖'}
              </div>
              <div className={styles.examContent}>
                <div className={styles.examHeader}>
                  <div className={styles.examName}>{e.name}</div>
                  <div className={styles.examStatus}>
                    <span className={`${styles.status} ${e.completed ? styles.completed : styles.inProgress}`}>
                      {e.completed ? '✅ Completed' : '🔄 In Progress'}
                    </span>
                  </div>
                </div>
                
                <div className={styles.examMeta}>
                  <div className={styles.metaItem}>
                    <span className={styles.metaIcon}>📊</span>
                    {e.questions_attempted}/{e.total_questions} questions
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaIcon}>⏱️</span>
                    {formatTime(e.time_spent_seconds ?? 0)}
                  </div>
                </div>

                <div className={styles.examProgress}>
                  <div className={styles.progressHeader}>
                    <div className={styles.progressLabel}>
                      Progress: {e.progress_percent ?? 0}%
                    </div>
                    <div className={styles.gradeSection}>
                      <div className={styles.grade}>{e.grade_letter ?? "—"}</div>
                      <div className={styles.points}>{e.points_scored ?? "—"} pts</div>
                    </div>
                  </div>
                  <div className={styles.progressTrack}>
                    <div 
                      className={`${styles.progressFill} ${e.completed ? styles.completedProgress : ''}`} 
                      style={{ width: `${Math.max(0, Math.min(100, e.progress_percent || 0))}%` }} 
                    />
                    <div className={styles.progressGlow}></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Improvement Section */}
      <div className={styles.improvement}>
        <div className={styles.improvementHeader}>
          <div className={styles.improvementTitleSection}>
            <h3 className={styles.improvementTitle}>
              <span className={styles.improvementIcon}>💡</span>
              Performance Insights
            </h3>
            <div className={styles.improvementSubtitle}>Personalized recommendations based on your progress</div>
          </div>
        </div>
        
        <div className={styles.insightsGrid}>
          <div className={styles.insightCard}>
            <div className={styles.insightGradient}></div>
            <div className={styles.insightIcon}>📈</div>
            <div className={styles.insightContent}>
              <div className={styles.insightLabel}>Average Score</div>
              <div className={styles.insightValue}>
                {agg.average_score_percent ?? "—"}%
              </div>
            </div>
          </div>
          
          <div className={styles.insightCard}>
            <div className={styles.insightGradient}></div>
            <div className={styles.insightIcon}>🎯</div>
            <div className={styles.insightContent}>
              <div className={styles.insightLabel}>Performance Trend</div>
              <div className={`${styles.insightValue} ${(agg.percentage_change_over_time > 0) ? styles.positive : styles.negative}`}>
                {agg.percentage_change_over_time !== undefined && agg.percentage_change_over_time !== null 
                  ? `${agg.percentage_change_over_time > 0 ? '↗' : '↘'} ${Math.abs(agg.percentage_change_over_time)}%`
                  : "—"}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.needs}>
          <div className={styles.needsHeader}>
            <h4 className={styles.needsTitle}>
              <span className={styles.warningIcon}>⚠️</span>
              Areas for Improvement
            </h4>
            <div className={styles.needsSubtitle}>Focus on these areas to boost your performance</div>
          </div>
          
          {agg.needs_improvement && agg.needs_improvement.length ? (
            <div className={styles.improvementList}>
              {agg.needs_improvement.map((n, index) => (
                <div key={n.exam_id} className={styles.improvementItem} style={{animationDelay: `${index * 0.1}s`}}>
                  <div className={styles.improvementPulse}></div>
                  <span className={styles.improvementBullet}>•</span>
                  <div className={styles.improvementContent}>
                    <div className={styles.improvementExam}>{n.name}</div>
                    <div className={styles.improvementReason}>{n.reason}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.allGood}>
              <div className={styles.allGoodGlow}></div>
              <span className={styles.successIcon}>🎉</span>
              <div className={styles.allGoodContent}>
                <div className={styles.allGoodTitle}>Excellent work!</div>
                <div className={styles.allGoodSubtitle}>Keep up the good progress and maintain your current study habits</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// helper
function formatTime(totalSeconds) {
  const s = Number(totalSeconds || 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${sec}s`;
  return `${sec}s`;
}