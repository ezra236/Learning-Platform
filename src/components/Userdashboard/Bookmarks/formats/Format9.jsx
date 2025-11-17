// components/bookmarks/formats/Format9.jsx
import React from "react";
import styles from "./Format9.module.css";

export default function Format9({ question, choices = [], specialchoices = [], user_selected }) {
  const correctOrder = question.special_correct_order || [];
  
  return (
    <div className={styles.wrap}>
      <div className={styles.passageSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionIcon}>📖</span>
          <h3 className={styles.sectionTitle}>Reading Passage</h3>
        </div>
        <div className={styles.passageContent} dangerouslySetInnerHTML={{ __html: question.paragraph_html }} />
      </div>

      {question.table_html && (
        <div className={styles.tableSection}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionIcon}>📊</span>
            <h3 className={styles.sectionTitle}>Data Table</h3>
          </div>
          <div className={styles.tableContainer}>
            <div className={styles.tableWrapper} dangerouslySetInnerHTML={{ __html: question.table_html }} />
            <div className={styles.tableOverlay}>
              <span className={styles.tableHint}>Scroll to view full table →</span>
            </div>
          </div>
        </div>
      )}

      <div className={styles.sequenceSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionIcon}>🔄</span>
          <h3 className={styles.sectionTitle}>Sequence Items</h3>
        </div>
        <div className={styles.sequenceContainer}>
          {specialchoices.map((sc, index) => (
            <div key={sc.id} className={styles.sequenceItem}>
              <div className={styles.sequenceNumber}>
                <span className={styles.numberCircle}>{index + 1}</span>
              </div>
              <div className={styles.sequenceContent} dangerouslySetInnerHTML={{ __html: sc.text_html }} />
            </div>
          ))}
        </div>
      </div>

      <div className={styles.explanationSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionIcon}>💡</span>
          <h3 className={styles.sectionTitle}>Explanation</h3>
        </div>
        <div className={styles.explanationContent} dangerouslySetInnerHTML={{ __html: question.explanation_html }} />
      </div>

      <div className={styles.answerSection}>
        <div className={styles.correctAnswer}>
          <span className={styles.answerIcon}>🎯</span>
          <div className={styles.answerContent}>
            <strong>Correct Sequence:</strong>
            <span className={styles.answerText}>
              {formatOrder(correctOrder, specialchoices)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatOrder(order = [], specialchoices = []) {
  if (!order.length) return "—";
  return order.map((id, index) => {
    const s = specialchoices.find(sc => String(sc.id) === String(id));
    return (
      <span key={id} className={styles.sequenceStep}>
        {s ? stripHtml(s.text_html) : String(id)}
        {index < order.length - 1 && <span className={styles.sequenceArrow}> → </span>}
      </span>
    );
  });
}

function stripHtml(html = "") {
  if (typeof window !== "undefined" && "DOMParser" in window) {
    const dp = new DOMParser();
    const doc = dp.parseFromString(html, "text/html");
    return doc.body.textContent || "";
  }
  return html.replace(/<[^>]*>/g, "");
}