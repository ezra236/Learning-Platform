// Dashboard.jsx
"use client";

import React, { useEffect, useState } from "react";
import styles from "./dashboard.module.css";
import ATIDashboard from "./Exams/ExamDashboard/ATIDashboard";
import HESIDashboard from "./Exams/ExamDashboard/HESIDashboard";
import Blog from "./Exams/Blog/Blog";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [examTypes, setExamTypes] = useState([]);
  const [atiExams, setAtiExams] = useState([]);
  const [hesiExams, setHesiExams] = useState([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [activeTab, setActiveTab] = useState("all");

  // NEW: exam filter state: "all" | "start" | "attempted" | "completed"
  const [examFilter, setExamFilter] = useState("all");

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";
        const res = await fetch(`${base}/api/user/exams-dashboard/`, {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        });

        if (res.status === 401) {
          throw new Error("Not authenticated. Please sign in.");
        }
        if (res.status === 403) {
          throw new Error("Forbidden. Only regular users may access exams.");
        }
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Server error: ${res.status} ${text}`);
        }

        const data = await res.json();
        setExamTypes(data.exam_types || []);
        setAtiExams(data.ati_exams || []);
        setHesiExams(data.hesi_exams || []);
        setTotalQuestions(data.total_questions_count || 0);
      } catch (err) {
        setError(err.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingAnimation}>
          <div className={styles.orbit}>
            <div className={styles.centralOrb}></div>
            <div className={styles.orbitingDot} style={{ '--delay': '0s' }}></div>
            <div className={styles.orbitingDot} style={{ '--delay': '0.2s' }}></div>
            <div className={styles.orbitingDot} style={{ '--delay': '0.4s' }}></div>
          </div>
        </div>
        <h2 className={styles.loadingTitle}>Preparing Your Learning Space</h2>
        <p className={styles.loadingSubtitle}>Loading your exams and progress...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorAnimation}>
          <div className={styles.errorOrb}></div>
          <div className={styles.errorPulse}></div>
        </div>
        <h2 className={styles.errorTitle}>Connection Issue</h2>
        <p className={styles.errorMessage}>{error}</p>
        <div className={styles.errorActions}>
          <button 
            className={styles.primaryButton}
            onClick={() => window.location.reload()}
          >
            🔄 Retry Connection
          </button>
          <button 
            className={styles.secondaryButton}
            onClick={() => window.location.href = '/support'}
          >
            💬 Get Help
          </button>
        </div>
      </div>
    );
  }

  const hasSubscription = (examTypes && examTypes.length > 0) || (atiExams.length > 0) || (hesiExams.length > 0);

  if (!hasSubscription) {
    return <Blog />;
  }

  const totalExams = atiExams.length + hesiExams.length;

  // Helper to classify an exam according to progress
  const examStatus = (exam) => {
    // user_progress is expected to be a number 0..100
    const p = Number(exam.user_progress || 0);
    if (p >= 100) return "completed";
    if (p > 0 && p < 100) return "attempted";
    return "start";
  };

  // Combined exam list (useful for counts)
  const allExams = [
    ...atiExams.map(e => ({ ...e, _type: "ati" })),
    ...hesiExams.map(e => ({ ...e, _type: "hesi" }))
  ];

  const counts = {
    all: allExams.length,
    start: allExams.filter(e => examStatus(e) === "start").length,
    attempted: allExams.filter(e => examStatus(e) === "attempted").length,
    completed: allExams.filter(e => examStatus(e) === "completed").length
  };

  // Filter function used when passing exams to child dashboards
  const passesFilter = (exam) => {
    if (examFilter === "all") return true;
    return examStatus(exam) === examFilter;
  };

  const filteredAtiExams = atiExams.filter(passesFilter);
  const filteredHesiExams = hesiExams.filter(passesFilter);

  // NEW: determine availability for ordering logic
  const atiAvailable = examTypes.includes("ATI_TEAS_7") && filteredAtiExams.length > 0;
  const hesiAvailable = examTypes.includes("HESI_A2") && filteredHesiExams.length > 0;

  // Helper renderers for sections so we can conditionally order them
  const renderAtiSection = () => (
    (examTypes.includes("ATI_TEAS_7")) && (
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionIconContainer}>
            <div className={styles.sectionIcon}>📚</div>
            <div className={styles.iconGlow}></div>
          </div>
          <div className={styles.sectionText}>
            <div className={styles.sectionBadge}>
              ATI TEAS 7
            </div>
            <h2 className={styles.sectionTitle}>Nursing Entrance Excellence</h2>
            <p className={styles.sectionDescription}>
              Master the essential concepts for your nursing career with comprehensive preparation materials
            </p>
          </div>
          <div className={styles.sectionStats}>
            <div className={styles.sectionStat}>
              <strong>{atiExams.length}</strong>
              <span>Exams</span>
            </div>
            <div className={styles.sectionStat}>
              <strong>
                {atiExams.reduce((acc, exam) => acc + exam.total_questions, 0)}
              </strong>
              <span>Questions</span>
            </div>
          </div>
        </div>
        {/* PASS FILTERED ATI EXAMS */}
        <ATIDashboard exams={filteredAtiExams} />
      </section>
    )
  );

  const renderHesiSection = () => (
    (examTypes.includes("HESI_A2")) && (
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionIconContainer}>
            <div className={styles.sectionIcon}>🧪</div>
            <div className={styles.iconGlow}></div>
          </div>
          <div className={styles.sectionText}>
            <div className={styles.sectionBadge}>
              HESI A2
            </div>
            <h2 className={styles.sectionTitle}>Health Education Mastery</h2>
            <p className={styles.sectionDescription}>
              Excel in health education programs with targeted practice and comprehensive assessment tools
            </p>
          </div>
          <div className={styles.sectionStats}>
            <div className={styles.sectionStat}>
              <strong>{hesiExams.length}</strong>
              <span>Exams</span>
            </div>
            <div className={styles.sectionStat}>
              <strong>
                {hesiExams.reduce((acc, exam) => acc + exam.total_questions, 0)}
              </strong>
              <span>Questions</span>
            </div>
          </div>
        </div>
        {/* PASS FILTERED HESI EXAMS */}
        <HESIDashboard exams={filteredHesiExams} />
      </section>
    )
  );

  return (
    <div className={styles.container}>
      {/* Enhanced Background Elements */}
      <div className={styles.backgroundElements}>
        <div className={styles.gradientOrb1}></div>
        <div className={styles.gradientOrb2}></div>
        <div className={styles.floatingParticles}>
          {[...Array(15)].map((_, i) => (
            <div key={i} className={styles.particle} style={{
              '--size': `${Math.random() * 4 + 2}px`,
              '--delay': `${Math.random() * 20}s`,
              '--duration': `${Math.random() * 10 + 15}s`,
              left: `${Math.random() * 100}%`,
              animationDelay: `calc(${Math.random() * 20}s + var(--delay))`
            }}></div>
          ))}
        </div>
      </div>

      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.welcomeSection}>
            <div className={styles.titleContainer}>
              <h1 className={styles.title}>
                <span className={styles.titleGradient}>Rushhourcamp</span>
              </h1>
              <div className={styles.titleUnderline}></div>
            </div>
            <p className={styles.subtitle}>Your personalized learning journey starts here</p>
          </div>
          
          <div className={styles.statsCard}>
            <div className={styles.statItem}>
              <div className={styles.statIcon}>📚</div>
              <div className={styles.statInfo}>
                <span className={styles.statNumber}>{totalExams}</span>
                <span className={styles.statLabel}>Active Exams</span>
              </div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statIcon}>❓</div>
              <div className={styles.statInfo}>
                <span className={styles.statNumber}>{totalQuestions}</span>
                <span className={styles.statLabel}>Total Questions</span>
              </div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statIcon}>⚡</div>
              <div className={styles.statInfo}>
                <span className={styles.statNumber}>
                  {Math.round(atiExams.reduce((acc, exam) => acc + exam.user_progress, 0) / totalExams) || 0}%
                </span>
                <span className={styles.statLabel}>Avg Progress</span>
              </div>
            </div>
          </div>

          {/* NEW: Filter card just below the stats card */}
          <div className={styles.filterCard} role="tablist" aria-label="Exam status filters">
            <button
              className={`${styles.filterButton} ${examFilter === "all" ? styles.filterButtonActive : ""}`}
              onClick={() => setExamFilter("all")}
              aria-pressed={examFilter === "all"}
            >
              All
              <span className={styles.filterBadge}>{counts.all}</span>
            </button>

            <button
              className={`${styles.filterButton} ${examFilter === "start" ? styles.filterButtonActive : ""}`}
              onClick={() => setExamFilter("start")}
              aria-pressed={examFilter === "start"}
            >
              Start
              <span className={styles.filterBadge}>{counts.start}</span>
            </button>

            <button
              className={`${styles.filterButton} ${examFilter === "attempted" ? styles.filterButtonActive : ""}`}
              onClick={() => setExamFilter("attempted")}
              aria-pressed={examFilter === "attempted"}
            >
              Attempted
              <span className={styles.filterBadge}>{counts.attempted}</span>
            </button>

            <button
              className={`${styles.filterButton} ${examFilter === "completed" ? styles.filterButtonActive : ""}`}
              onClick={() => setExamFilter("completed")}
              aria-pressed={examFilter === "completed"}
            >
              Completed
              <span className={styles.filterBadge}>{counts.completed}</span>
            </button>
          </div>
        </div>

        {/* Enhanced Navigation Tabs */}
        <div className={styles.tabContainer}>
          <button 
            className={`${styles.tab} ${activeTab === "all" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("all")}
          >
            <span className={styles.tabIcon}>🌟</span>
            All Exams
            <span className={styles.tabBadge}>{totalExams}</span>
          </button>
          {examTypes.includes("ATI_TEAS_7") && (
            <button 
              className={`${styles.tab} ${activeTab === "ati" ? styles.tabActive : ""}`}
              onClick={() => setActiveTab("ati")}
            >
              <span className={styles.tabIcon}>📚</span>
              ATI TEAS 7
              <span className={styles.tabBadge}>{atiExams.length}</span>
            </button>
          )}
          {examTypes.includes("HESI_A2") && (
            <button 
              className={`${styles.tab} ${activeTab === "hesi" ? styles.tabActive : ""}`}
              onClick={() => setActiveTab("hesi")}
            >
              <span className={styles.tabIcon}>🧪</span>
              HESI A2
              <span className={styles.tabBadge}>{hesiExams.length}</span>
            </button>
          )}
        </div>
      </div>

      <div className={styles.examsContainer}>
        {/*
          Ordering logic:
          - If activeTab === "all" and one of the groups is empty (after filtering) while the other is non-empty,
            render the non-empty group first.
          - Otherwise keep the default ordering (ATI then HESI).
          - If a specific tab is selected, only render that section as before.
        */}

        {activeTab === "all" ? (
          (() => {
            // If ATI available but HESI not => ATI first (HESI will still render but may be empty)
            if (atiAvailable && !hesiAvailable) {
              return (
                <>
                  {renderAtiSection()}
                  {renderHesiSection()}
                </>
              );
            }
            // If HESI available but ATI not => HESI first
            if (hesiAvailable && !atiAvailable) {
              return (
                <>
                  {renderHesiSection()}
                  {renderAtiSection()}
                </>
              );
            }
            // Otherwise keep default order (ATI then HESI)
            return (
              <>
                {renderAtiSection()}
                {renderHesiSection()}
              </>
            );
          })()
        ) : activeTab === "ati" ? (
          // only ATI tab
          renderAtiSection()
        ) : activeTab === "hesi" ? (
          // only HESI tab
          renderHesiSection()
        ) : null}
      </div>
    </div>
  );
}
