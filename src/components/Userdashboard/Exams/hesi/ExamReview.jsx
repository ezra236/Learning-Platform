import React, { useState } from "react";
import styles from "./ExamReview.module.css";

export default function ExamReview({ exam, attempt }) {
  const [expandedQuestion, setExpandedQuestion] = useState(null);

  if (!exam || !attempt) return <div className={styles.empty}>📊 No review data available</div>;

  const answers = attempt.answers || {};
  const score = attempt.points_scored ?? 0;
  const total = attempt.total_questions || exam.questions.length || 0;
  const percentage = attempt.grade ?? (total ? (score / total) * 100 : 0);

  const toggleQuestion = (index) => {
    setExpandedQuestion(expandedQuestion === index ? null : index);
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return styles.scoreExcellent;
    if (percentage >= 60) return styles.scoreGood;
    if (percentage >= 40) return styles.scoreAverage;
    return styles.scorePoor;
  };

  const renderChoiceLine = (c, idx, userIds) => {
    const label = String.fromCharCode(65 + idx);
    const isSelected = userIds && userIds.includes(String(c.id));
    const isCorrect = !!c.is_correct;

    return (
      <div
        key={c.id}
        className={`${styles.choice} ${isSelected ? styles.selected : ""} ${isCorrect ? styles.correct : ""}`}
      >
        <div className={styles.label}>{label}.</div>
        <div className={styles.text} dangerouslySetInnerHTML={{ __html: c.text_html }} />
        <div className={styles.badges}>
          {isSelected && <span className={styles.badgeYour}>Your Answer</span>}
          {isCorrect && <span className={styles.badgeCorrect}>Correct</span>}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h4>📊 Exam Review</h4>
        <div className={`${styles.score} ${getScoreColor(percentage)}`}>
          <div className={styles.scoreMain}>{Math.round(percentage)}%</div>
          <div className={styles.scoreSub}>
            {score} / {total} correct
          </div>
        </div>
      </div>

      <div className={styles.list}>
        {exam.questions.map((q, index) => {
          const uid = String(q.id);
          const userAns = answers[uid];

          // normalized userIds for choice rendering (array of string ids)
          const userIds = (() => {
            if (Array.isArray(userAns)) return userAns.map(String);
            if (userAns != null) return [String(userAns)];
            return [];
          })();

          // normalizedUserAnsArray used for ordered / specialchoices comparison & rendering
          const normalizedUserAnsArray = (() => {
            if (Array.isArray(userAns)) return userAns.map(String);
            if (userAns && typeof userAns === "object") {
              // If backend returned an object (e.g. {0: '12', 1: '13'}), fall back to values.
              // NOTE: Object.values may not preserve intended order if keys are non-numeric; server-side arrays are preferable.
              return Object.values(userAns).map(String);
            }
            if (userAns != null) return [String(userAns)];
            return [];
          })();

          // determine correctness: prefer specialchoices when present
          let isCorrect = false;

          if (q.specialchoices && q.specialchoices.length > 0) {
            // compare normalized arrays (stringified) so number/string id differences don't break it
            const normUser = normalizedUserAnsArray;
            const normCorrect = (q.special_correct_order || []).map(String);
            try {
              isCorrect = JSON.stringify(normUser) === JSON.stringify(normCorrect);
            } catch {
              isCorrect = false;
            }
          } else if (q.choices && q.choices.length > 0) {
            const correctIds = q.choices.filter((c) => c.is_correct).map((c) => String(c.id));
            if (userIds.length === correctIds.length && userIds.every((id) => correctIds.includes(String(id)))) {
              isCorrect = true;
            } else {
              isCorrect = false;
            }
          } else {
            // fallback: attempt a direct deep-equality check (for any other custom formats)
            try {
              isCorrect = JSON.stringify(userAns) === JSON.stringify(q.special_correct_order || []);
            } catch {
              isCorrect = false;
            }
          }

          return (
            <div key={q.id} className={styles.q}>
              <div
                className={`${styles.qheader} ${isCorrect ? styles.correctHeader : styles.incorrectHeader}`}
                onClick={() => toggleQuestion(index)}
              >
                <div className={styles.qtitleWrapper}>
                  <span className={styles.qnumber}>Q{index + 1}</span>
                  <span className={styles.qstatus}>{isCorrect ? "✅ Correct" : "❌ Incorrect"}</span>
                </div>
                <div className={styles.arrow}>{expandedQuestion === index ? "▲" : "▼"}</div>
              </div>

              {expandedQuestion === index && (
                <div className={styles.qcontent}>
                  <div
                    className={styles.qtitle}
                    dangerouslySetInnerHTML={{ __html: q.question_html || q.paragraph_html || "" }}
                  />

                  {q.choices && q.choices.length > 0 && (
                    <div className={styles.choices}>
                      {q.choices.map((c, idx) => renderChoiceLine(c, idx, userIds))}
                    </div>
                  )}

                  {q.specialchoices && q.specialchoices.length > 0 && (
                    <div className={styles.specialWrap}>
                      <div className={styles.column}>
                        <strong>📋 Your Order</strong>
                        <ol>
                          {normalizedUserAnsArray.map((id, i) => {
                            const sc = q.specialchoices.find((s) => String(s.id) === String(id));
                            const correctIdAtPos = (q.special_correct_order || [])[i];
                            const match = String(correctIdAtPos) === String(id);
                            return (
                              <li key={`${id}-${i}`} className={match ? styles.match : styles.mismatch}>
                                <div dangerouslySetInnerHTML={{ __html: sc ? sc.text_html : "—" }} />
                                {match ? (
                                  <span className={styles.badgeCorrectSmall}>✓</span>
                                ) : (
                                  <span className={styles.badgeYourSmall}>✕</span>
                                )}
                              </li>
                            );
                          })}
                        </ol>
                      </div>

                      <div className={styles.column}>
                        <strong>🎯 Correct Order</strong>
                        <ol>
                          {(q.special_correct_order || []).map((id) => {
                            const sc = q.specialchoices.find((s) => String(s.id) === String(id));
                            return (
                              <li key={`correct-${id}`} dangerouslySetInnerHTML={{ __html: sc ? sc.text_html : "—" }} />
                            );
                          })}
                        </ol>
                      </div>
                    </div>
                  )}

                  {q.explanation_html && (
                    <div className={styles.explanation}>
                      <strong>💡 Explanation:</strong>
                      <div dangerouslySetInnerHTML={{ __html: q.explanation_html }} />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
