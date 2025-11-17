// components/bookmarks/formats/Format4.jsx
import React from "react";
import styles from "./Format4.module.css";

export default function Format4({ question, choices = [], specialchoices = [], user_selected }) {
  const correctChoices = choices.filter(c => c.is_correct);
  
  return (
    <div className={styles.wrap}>
      <div className={styles.passageSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionIcon}>📖</span>
          <h3 className={styles.sectionTitle}>Reading Passage</h3>
        </div>
        <div className={styles.passageContent} dangerouslySetInnerHTML={{ __html: question.paragraph_html }} />
      </div>

      <div className={styles.questionSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionIcon}>❓</span>
          <h3 className={styles.sectionTitle}>Question</h3>
        </div>
        <div className={styles.questionContent} dangerouslySetInnerHTML={{ __html: question.question_html }} />
      </div>
      
      <div className={styles.choicesSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionIcon}>📋</span>
          <h3 className={styles.sectionTitle}>Options</h3>
        </div>
        <ol className={styles.choices}>
          {choices.map((c, index) => (
            <li key={c.id} className={`${styles.choiceItem} ${c.is_correct ? styles.correctChoice : ''}`}>
              <div className={styles.choiceContent}>
                <span className={styles.choiceNumber}>{String.fromCharCode(65 + index)}</span>
                <span className={styles.choiceText} dangerouslySetInnerHTML={{ __html: c.text_html }} />
                <span className={styles.choiceMarker}>
                  {c.is_correct ? '✅' : '⚪'}
                </span>
              </div>
            </li>
          ))}
        </ol>
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
            <strong>Correct Answer:</strong>
            <span className={styles.answerText}>
              {correctChoices.map(c => stripHtml(c.text_html)).join(", ")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function stripHtml(html = "") {
  if (typeof window !== "undefined" && "DOMParser" in window) {
    const dp = new DOMParser();
    const doc = dp.parseFromString(html, "text/html");
    return doc.body.textContent || "";
  }
  return html.replace(/<[^>]*>/g, "");
}