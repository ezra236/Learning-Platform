// components/Main.jsx
import React, { useEffect, useState } from "react";
import styles from "./Main.module.css";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

function getCookie(name) {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

async function ensureCsrfCookie() {
  await fetch(`${API_BASE}/api/csrf/`, {
    method: "GET",
    credentials: "include",
    headers: { "Accept": "application/json" }
  });
}

export default function Main() {
  const [activeView, setActiveView] = useState("management");

  useEffect(() => {
    ensureCsrfCookie().catch((err) => console.error("CSRF cookie fetch failed:", err));
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerMain}>
            <div className={styles.headerIcon}>🎯</div>
            <div className={styles.headerText}>
              <h1 className={styles.headerTitle}>Exam Management Suite</h1>
              <p className={styles.headerSubtitle}>Manage exams and free trials with ease</p>
            </div>
          </div>
          <div className={styles.viewSwitcher}>
            <button 
              className={`${styles.viewBtn} ${activeView === "management" ? styles.viewBtnActive : ''}`}
              onClick={() => setActiveView("management")}
            >
              <span className={styles.btnIcon}>🗂️</span>
              <span>Manage Exams</span>
            </button>
            <button 
              className={`${styles.viewBtn} ${activeView === "freeTrials" ? styles.viewBtnActive : ''}`}
              onClick={() => setActiveView("freeTrials")}
            >
              <span className={styles.btnIcon}>🎁</span>
              <span>Free Trials</span>
            </button>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        {activeView === "management" ? <LeftPane /> : <RightPane />}
      </div>
    </div>
  );
}

function LeftPane() {
  const [type, setType] = useState("ati");
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchExams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  async function fetchExams() {
    setLoading(true);
    try {
      const url = `${API_BASE}/api/exams/?type=${encodeURIComponent(type)}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to fetch");
      }
      const data = await res.json();
      setExams(data);
    } catch (err) {
      console.error(err);
      setExams([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`🗑️ Delete "${name}" and all its content?`)) return;
    try {
      const csrftoken = getCookie("csrftoken");
      const url = `${API_BASE}/api/exams/${id}/?type=${encodeURIComponent(type)}`;
      const res = await fetch(url, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "X-CSRFToken": csrftoken,
          "Accept": "application/json",
        },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Delete failed");
      }
      setExams((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      console.error("Delete error:", err);
      alert("❌ Failed to delete exam. See console for details.");
    }
  }

  const typeIcon = type === "ati" ? "📚" : "🩺";
  const filteredExams = exams.filter(exam => 
    exam.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.pane}>
      <div className={styles.paneHeader}>
        <div className={styles.titleSection}>
          <div className={styles.titleIcon}>🗂️</div>
          <div>
            <h2 className={styles.paneTitle}>Exam Management</h2>
            <div className={styles.paneSubtitle}>Delete exams and their content</div>
          </div>
        </div>
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{exams.length}</span>
            <span className={styles.statLabel}>Total Exams</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{exams.filter(e => e.isfree).length}</span>
            <span className={styles.statLabel}>Free Trials</span>
          </div>
        </div>
      </div>

      <div className={styles.controlGroup}>
        <div className={styles.controlHeader}>
          <span className={styles.controlIcon}>🎛️</span>
          <span>Filter & Search</span>
        </div>
        <div className={styles.controlGrid}>
          <label className={styles.label}>
            <span className={styles.labelText}>Exam Type</span>
            <select
              className={styles.select}
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="ati">📚 ATI Exams</option>
              <option value="hesi">🩺 HESI Exams</option>
            </select>
          </label>
          <label className={styles.label}>
            <span className={styles.labelText}>Search Exams</span>
            <div className={styles.searchWrapper}>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Type to search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className={styles.searchIcon}>🔍</span>
            </div>
          </label>
        </div>
      </div>

      <div className={styles.list}>
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.loadingSpinner}>
              <div className={styles.spinner}></div>
            </div>
            <div className={styles.loadingText}>
              <div>Loading exams...</div>
              <div className={styles.loadingSubtitle}>Fetching your exam data</div>
            </div>
          </div>
        ) : filteredExams.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🔍</div>
            <div className={styles.emptyText}>
              <div>No exams found</div>
              <div className={styles.emptySubtitle}>
                {searchTerm ? "Try adjusting your search terms" : "Try selecting a different exam type"}
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.examList}>
            <div className={styles.listHeader}>
              <span>Exam List</span>
              <span className={styles.listCount}>
                {filteredExams.length} of {exams.length} exams
              </span>
            </div>
            {filteredExams.map((exam) => (
              <div key={exam.id} className={styles.examCard}>
                <div className={styles.examMain}>
                  <div className={styles.examIcon}>{typeIcon}</div>
                  <div className={styles.examContent}>
                    <div className={styles.examName}>{exam.name}</div>
                    <div className={styles.examMeta}>
                      <div className={styles.metaTags}>
                        {exam.isfree && (
                          <span className={styles.tagFree}>
                            <span className={styles.tagIcon}>🆓</span>
                            Free Trial
                          </span>
                        )}
                        {exam.completed && (
                          <span className={styles.tagCompleted}>
                            <span className={styles.tagIcon}>✅</span>
                            Completed
                          </span>
                        )}
                        <span className={styles.examType}>
                          {type === "ati" ? "ATI" : "HESI"}
                        </span>
                      </div>
                      <div className={styles.examId}>ID: {exam.id}</div>
                    </div>
                  </div>
                </div>
                <div className={styles.examActions}>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => handleDelete(exam.id, exam.name)}
                    title={`Delete ${exam.name}`}
                  >
                    <span className={styles.btnIcon}>🗑️</span>
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RightPane() {
  const [type, setType] = useState("ati");
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchExams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  async function fetchExams() {
    setLoading(true);
    try {
      const url = `${API_BASE}/api/exams/?type=${encodeURIComponent(type)}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to fetch");
      }
      const data = await res.json();
      setExams(data);
    } catch (err) {
      console.error(err);
      setExams([]);
    } finally {
      setLoading(false);
    }
  }

  async function allowFreeTrial(id, name) {
    try {
      const csrftoken = getCookie("csrftoken");
      const url = `${API_BASE}/api/exams/${id}/set_free/?type=${encodeURIComponent(type)}`;
      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrftoken,
          "Accept": "application/json",
        },
        body: JSON.stringify({ isfree: true }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Set free failed");
      }
      const updated = await res.json();
      setExams((prev) => prev.map((e) => (e.id === id ? { ...e, isfree: true } : e)));
    } catch (err) {
      console.error("Allow free error:", err);
      alert("❌ Failed to enable free trial. See console for details.");
    }
  }

  const typeIcon = type === "ati" ? "📚" : "🩺";
  const freeExamsCount = exams.filter(exam => exam.isfree).length;
  const filteredExams = exams.filter(exam => 
    exam.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.pane}>
      <div className={styles.paneHeader}>
        <div className={styles.titleSection}>
          <div className={styles.titleIcon}>🎁</div>
          <div>
            <h2 className={styles.paneTitle}>Free Trial Management</h2>
            <div className={styles.paneSubtitle}>Enable free access to exams</div>
          </div>
        </div>
        <div className={styles.stats}>
          <div className={`${styles.statItem} ${styles.statFree}`}>
            <span className={styles.statNumber}>{freeExamsCount}</span>
            <span className={styles.statLabel}>Free Trials</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{exams.length}</span>
            <span className={styles.statLabel}>Total Exams</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{Math.round((freeExamsCount / exams.length) * 100) || 0}%</span>
            <span className={styles.statLabel}>Free Ratio</span>
          </div>
        </div>
      </div>

      <div className={styles.controlGroup}>
        <div className={styles.controlHeader}>
          <span className={styles.controlIcon}>🎛️</span>
          <span>Filter & Search</span>
        </div>
        <div className={styles.controlGrid}>
          <label className={styles.label}>
            <span className={styles.labelText}>Exam Type</span>
            <select
              className={styles.select}
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="ati">📚 ATI Exams</option>
              <option value="hesi">🩺 HESI Exams</option>
            </select>
          </label>
          <label className={styles.label}>
            <span className={styles.labelText}>Search Exams</span>
            <div className={styles.searchWrapper}>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Type to search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className={styles.searchIcon}>🔍</span>
            </div>
          </label>
        </div>
      </div>

      <div className={styles.list}>
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.loadingSpinner}>
              <div className={styles.spinner}></div>
            </div>
            <div className={styles.loadingText}>
              <div>Loading exams...</div>
              <div className={styles.loadingSubtitle}>Fetching your exam data</div>
            </div>
          </div>
        ) : filteredExams.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🔍</div>
            <div className={styles.emptyText}>
              <div>No exams found</div>
              <div className={styles.emptySubtitle}>
                {searchTerm ? "Try adjusting your search terms" : "Try selecting a different exam type"}
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.examList}>
            <div className={styles.listHeader}>
              <span>Available Exams</span>
              <span className={styles.listCount}>
                {freeExamsCount} of {exams.length} free • {filteredExams.length} showing
              </span>
            </div>
            {filteredExams.map((exam) => (
              <div key={exam.id} className={`${styles.examCard} ${exam.isfree ? styles.freeExam : ''}`}>
                <div className={styles.examMain}>
                  <div className={styles.examIcon}>{typeIcon}</div>
                  <div className={styles.examContent}>
                    <div className={styles.examName}>{exam.name}</div>
                    <div className={styles.examMeta}>
                      <div className={styles.metaTags}>
                        {exam.isfree ? (
                          <span className={styles.tagFreeActive}>
                            <span className={styles.tagIcon}>🎉</span>
                            Free Trial Active
                          </span>
                        ) : (
                          <span className={styles.tagPaid}>
                            <span className={styles.tagIcon}>💎</span>
                            Premium
                          </span>
                        )}
                        {exam.completed && (
                          <span className={styles.tagCompleted}>
                            <span className={styles.tagIcon}>✅</span>
                            Completed
                          </span>
                        )}
                        <span className={styles.examType}>
                          {type === "ati" ? "ATI" : "HESI"}
                        </span>
                      </div>
                      <div className={styles.examId}>ID: {exam.id}</div>
                    </div>
                  </div>
                </div>
                <div className={styles.examActions}>
                  <button
                    className={`${styles.primaryBtn} ${exam.isfree ? styles.disabledBtn : ''}`}
                    disabled={exam.isfree}
                    onClick={() => allowFreeTrial(exam.id, exam.name)}
                    title={exam.isfree ? "Free trial already active" : `Enable free trial for ${exam.name}`}
                  >
                    <span className={styles.btnIcon}>
                      {exam.isfree ? '✅' : '✨'}
                    </span>
                    <span>{exam.isfree ? "Enabled" : "Make Free"}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}