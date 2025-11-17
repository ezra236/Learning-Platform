import React from "react";
import styles from "./Choice.module.css";

export default function Choice({
  label,
  html,
  selected = false,
  onClick = () => {},
  revealCorrect = false,
  isCorrect = false,
}) {
  const getChoiceStyle = () => {
    if (revealCorrect && isCorrect) return styles.correct;
    if (selected && revealCorrect && !isCorrect) return styles.incorrect;
    if (selected) return styles.selected;
    return styles.default;
  };

  const handleKey = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      className={`${styles.choice} ${getChoiceStyle()}`}
      onClick={onClick}
      onKeyDown={handleKey}
    >
      <div className={styles.label} aria-hidden>
        {label}
      </div>

      <div className={styles.content}>
        <div
          className={styles.html}
          dangerouslySetInnerHTML={{ __html: html }}
        />

        <div className={styles.badges}>
          {selected && <span className={styles.badgeYour}>Your answer</span>}

          {revealCorrect && isCorrect && (
            <span className={styles.badgeCorrect}>
              <span className={styles.icon}>✓</span> Correct answer
            </span>
          )}

          {selected && revealCorrect && !isCorrect && (
            <span className={styles.badgeWrong}>
              <span className={styles.icon}>✕</span> Wrong answer
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
