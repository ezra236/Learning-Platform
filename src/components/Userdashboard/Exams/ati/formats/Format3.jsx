import React, { useState } from "react";
import Choice from "../Choice";
import Report from "../Report";
import styles from "./Format3.module.css";

export default function Format3({ question, mode, selectedAnswer, onAnswer, onBookmark, onReport }) {
  const [reveal, setReveal] = useState(false);
  const choices = question.choices || [];

  const handleClick = (choiceId) => {
    onAnswer(choiceId, { autosave: true });
    if (mode === "tutormode") setReveal(true);
  };

  return (
    <div className={styles.container}>
      <div className={styles.questionHeader}>
        <div className={styles.questionMeta}>
          <span className={styles.questionType}>Reading Passage with Image</span>
          <span className={styles.difficulty}>Medium</span>
        </div>
      </div>
      
      <div className={styles.questionContent}>
        <div className={styles.passageSection}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionIcon}>📖</span>
            <span>Reading Passage</span>
          </div>
          <div className={styles.paragraph} dangerouslySetInnerHTML={{__html: question.paragraph_html}} />
          
          {question.image_url && (
            <div className={styles.imageContainer}>
              <img src={question.image_url} alt="Passage illustration" className={styles.image} />
              <div className={styles.imageCaption}>📷 Passage Image</div>
            </div>
          )}
        </div>

        <div className={styles.questionSection}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionIcon}>❓</span>
            <span>Question</span>
          </div>
          <div className={styles.q} dangerouslySetInnerHTML={{__html: question.question_html}} />
        </div>
        
        <div className={styles.choices}>
          {choices.map((c, idx) => {
            const label = String.fromCharCode(65 + idx);
            const isSelected = String(selectedAnswer) === String(c.id);
            return (
              <Choice
                key={c.id}
                label={label}
                html={c.text_html}
                selected={isSelected}
                onClick={() => handleClick(c.id)}
                revealCorrect={reveal}
                isCorrect={c.is_correct}
              />
            );
          })}
        </div>
      </div>

      <div className={styles.actions}>
        <button className={styles.bookmarkBtn} onClick={onBookmark}>
          📚 Bookmark
        </button>
        <Report onSubmit={onReport} />
        {mode === "reviewmode" && (
          <button 
            className={styles.revealBtn} 
            onClick={() => setReveal(r => !r)}
          >
            {reveal ? "🙈 Hide Answer" : "👁️ Show Answer"}
          </button>
        )}
      </div>

      {reveal && (
        <div className={styles.explanation}>
          <div className={styles.explanationHeader}>
            <span className={styles.explanationIcon}>💡</span>
            <strong>Explanation</strong>
          </div>
          <div dangerouslySetInnerHTML={{__html: question.explanation_html}} />
        </div>
      )}
    </div>
  );
}