// formats/Format8.jsx
import React, { useState } from "react";
import DragOrder from "../DragOrder";
import Report from "../Report";
import styles from "./Format8.module.css";

export default function Format8({ question, mode, selectedAnswer, onAnswer, onBookmark, onReport }) {
  const [showAnswer, setShowAnswer] = useState(false);

  const initialOrder = Array.isArray(selectedAnswer)
    ? selectedAnswer
    : (question.specialchoices || []).map((s) => s.id);

  const handleSaveOrder = (orderedIds) => {
    onAnswer(orderedIds, { autosave: true });
    if (mode === "tutormode") setShowAnswer(true);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h3 className={styles.title}>Format 8 — Table ordering</h3>
      </header>

      <section className={styles.question}>
        <div dangerouslySetInnerHTML={{ __html: question.question_html }} />
      </section>

      {question.table_html && (
        <section className={styles.table} dangerouslySetInnerHTML={{ __html: question.table_html }} />
      )}

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
          <div className={styles.correctOrder}>
            <strong>Correct order</strong>
            <ol>
              {(question.special_correct_order || []).map((id) => {
                const sc = question.specialchoices.find((s) => s.id === id);
                return <li key={id} dangerouslySetInnerHTML={{ __html: sc ? sc.text_html : "" }} />;
              })}
            </ol>
          </div>

          {question.explanation_html && (
            <div className={styles.explanation} dangerouslySetInnerHTML={{ __html: question.explanation_html }} />
          )}
        </section>
      )}
    </div>
  );
}
