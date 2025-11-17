// components/bookmarks/BookmarkedQuestions.jsx
import React, { useEffect, useState } from "react";
import styles from "./BookmarkedQuestions.module.css";

import Format1 from "./formats/Format1";
import Format2 from "./formats/Format2";
import Format3 from "./formats/Format3";
import Format4 from "./formats/Format4";
import Format5 from "./formats/Format5";
import Format6 from "./formats/Format6";
import Format7 from "./formats/Format7";
import Format8 from "./formats/Format8";
import Format9 from "./formats/Format9";
import Format10 from "./formats/Format10";

const formatComponents = {
  1: Format1,
  2: Format2,
  3: Format3,
  4: Format4,
  5: Format5,
  6: Format6,
  7: Format7,
  8: Format8,
  9: Format9,
  10: Format10,
};

export default function BookmarkedQuestions() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedExam, setSelectedExam] = useState('all');

  useEffect(() => {
    async function fetchBookmarks() {
      setLoading(true);
      setError(null);
      try {
        const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";
        const res = await fetch(`${base}/api/bookmarks/`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Accept": "application/json"
          }
        });
        if (!res.ok) {
          throw new Error(`Failed to fetch bookmarks (${res.status})`);
        }
        const data = await res.json();
        setBookmarks(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchBookmarks();
  }, []);

  const filteredBookmarks = selectedExam === 'all'
    ? bookmarks
    : bookmarks.filter(item => String(item.exam_name) === selectedExam);

  // compute counts per exam
  const examCounts = bookmarks.reduce((acc, item) => {
    const exam = item.exam_name || "Unknown";
    acc[exam] = (acc[exam] || 0) + 1;
    return acc;
  }, {});

  if (loading) return (
    <div className={styles.status}>
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}>✨</div>
        <div className={styles.loadingBars}>
          <div className={styles.loadingBar}></div>
          <div className={styles.loadingBar}></div>
          <div className={styles.loadingBar}></div>
        </div>
        <p className={styles.loadingText}>Loading your knowledge treasures...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className={styles.statusError}>
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon}>⚡</div>
        <h3>Oops! Something went wrong</h3>
        <p className={styles.errorDetail}>{error}</p>
        <button
          className={styles.retryButton}
          onClick={() => window.location.reload()}
        >
          🔄 Try Again
        </button>
      </div>
    </div>
  );

  if (!bookmarks.length) return (
    <div className={styles.status}>
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>📚</div>
        <h3>No Bookmarks Yet</h3>
        <p className={styles.emptySubtitle}>Your saved questions will appear here</p>
        <div className={styles.emptyTips}>
          <div className={styles.tipItem}>
            <span className={styles.tipIcon}>💡</span>
            Bookmark questions to review later
          </div>
          <div className={styles.tipItem}>
            <span className={styles.tipIcon}>🎯</span>
            Track your progress over time
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <h1 className={styles.title}>
              <span className={styles.titleIcon}>🔖</span>
               Bookmarked Questions
            </h1>
            <p className={styles.subtitle}>Your personal collection of learning materials</p>
          </div>
          <div className={styles.statsSection}>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>{bookmarks.length}</div>
              <div className={styles.statLabel}>Total Bookmarks</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>{Object.keys(examCounts).length}</div>
              <div className={styles.statLabel}>Exams</div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.filterSection}>
          <span className={styles.filterLabel}>📊 Filter by exam:</span>
          <select
            className={styles.formatFilter}
            value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value)}
          >
            <option value="all">All Exams ({bookmarks.length})</option>
            {Object.entries(examCounts).map(([examName, count]) => (
              <option key={examName} value={examName}>
                {examName} ({count})
              </option>
            ))}
          </select>
        </div>
        <div className={styles.resultsInfo}>
          Showing {filteredBookmarks.length} of {bookmarks.length} bookmarks
        </div>
      </div>

      <div className={styles.list}>
        {filteredBookmarks.map((item, index) => {
          const fmt = item.question?.format;
          const FormatComponent = formatComponents[fmt] || Format1;
          return (
            <div
              key={`${item.source}-${item.bookmark_id}`}
              className={styles.bookmarkCard}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={styles.cardHeader}>
                <div className={styles.headerMain}>
                  <div className={styles.examInfo}>
                    <div className={styles.examName}>
                      <span className={styles.examIcon}>📝</span>
                      {item.exam_name}
                    </div>
                    {/* format badge removed as requested */}
                  </div>
                  <span className={`${styles.sourceTag} ${styles[item.source]}`}>
                    {item.source.toUpperCase()}
                  </span>
                </div>
                <div className={styles.meta}>
                  <span className={styles.metaItem}>
                    <span className={styles.metaIcon}>🔢</span>
                    Order: {item.question.order}
                  </span>
                  <span className={styles.metaItem}>
                    <span className={styles.metaIcon}>🕒</span>
                    {new Date(item.bookmark_created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className={styles.cardBody}>
                <FormatComponent
                  question={item.question}
                  choices={item.choices}
                  specialchoices={item.specialchoices}
                  user_selected={item.user_selected}
                />
              </div>

              <div className={styles.cardFooter}>
                <div className={styles.footerItem}>
                  <span className={styles.footerIcon}>👤</span>
                  <span className={styles.selectedInfo}>
                    Your selection: <strong>{formatUserSelection(item.user_selected, item.choices, item.specialchoices)}</strong>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatUserSelection(user_selected, choices = [], specialchoices = []) {
  if (user_selected == null) return "No attempt";
  if (Array.isArray(user_selected)) {
    const mapped = user_selected.map((id) => {
      const sc = specialchoices.find((s) => s.id === id || String(s.id) === String(id));
      return sc ? stripHtml(sc.text_html) : String(id);
    });
    return mapped.join(" → ");
  }
  const ch = choices.find((c) => c.id === user_selected || String(c.id) === String(user_selected));
  return ch ? stripHtml(ch.text_html) : String(user_selected);
}

function stripHtml(html) {
  if (!html) return "";
  if (typeof window !== "undefined" && "DOMParser" in window) {
    const dp = new DOMParser();
    const doc = dp.parseFromString(html, "text/html");
    return doc.body.textContent || "";
  }
  return html.replace(/<[^>]*>/g, "");
}
