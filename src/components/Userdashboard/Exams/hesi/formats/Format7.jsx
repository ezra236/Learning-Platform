// formats/Format7.jsx
import React, { useState } from "react";
import DragOrder from "../DragOrder";
import Report from "../Report";
import styles from "./Format7.module.css";

export default function Format7({ question, mode, selectedAnswer, onAnswer, onBookmark, onReport }) {
  // showAnswer only true after user saves (tutor) or toggles in review
  const [showAnswer, setShowAnswer] = useState(false);

  const initialOrder = Array.isArray(selectedAnswer)
    ? selectedAnswer
    : (question.specialchoices || []).map((s) => s.id);

  const handleSaveOrder = (orderedIds) => {
    // save answer (ordered list of specialchoice ids)
    onAnswer(orderedIds, { autosave: true });
    // only reveal automatically in tutormode after user saved
    if (mode === "tutormode") setShowAnswer(true);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.meta}>
          <span className={styles.type}>Format 7 — Ordering</span>
        </div>
      </header>

      <section className={styles.passage}>
        {question.paragraph_html ? (
          <div className={styles.passageContent} dangerouslySetInnerHTML={{ __html: question.paragraph_html }} />
        ) : null}
      </section>

      <section className={styles.question}>
        <div dangerouslySetInnerHTML={{ __html: question.question_html }} />
      </section>

      <section className={styles.dragArea}>
        <DragOrder items={question.specialchoices} initialOrder={initialOrder} onSave={handleSaveOrder} />
      </section>

      <div className={styles.controls}>
        <button className={styles.bookmark} onClick={onBookmark}>📚 Bookmark</button>
        <Report onSubmit={onReport} />
        {mode === "reviewmode" && (
          <button className={styles.reveal} onClick={() => setShowAnswer((s) => !s)}>
            {showAnswer ? "🙈 Hide Answer" : "👁️ Show Answer"}
          </button>
        )}
      </div>

      {showAnswer && (
        <section className={styles.answerBox}>
          <div className={styles.answerHeader}><strong>Correct order</strong></div>
          <div className={styles.correctOrder}>
            <ol>
              {(question.special_correct_order || []).map((id) => {
                const sc = question.specialchoices.find((s) => s.id === id);
                return (
                  <li key={id} className={styles.correctItem}>
                    <div dangerouslySetInnerHTML={{ __html: sc ? sc.text_html : "" }} />
                  </li>
                );
              })}
            </ol>
          </div>

          {question.explanation_html && (
            <div className={styles.explanation}>
              <strong>Explanation</strong>
              <div dangerouslySetInnerHTML={{ __html: question.explanation_html }} />
            </div>
          )}
        </section>
      )}
    </div>
  );
}
