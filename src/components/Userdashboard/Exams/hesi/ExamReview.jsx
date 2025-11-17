import React, { useState } from "react";
import styles from "./ExamReview.module.css";

export default function ExamReview({ exam, attempt }) {
  const [expandedQuestion, setExpandedQuestion] = useState(null);

  if (!exam || !attempt) return <div className={styles.empty}>📊 No review data available</div>;

  const answers = attempt.answers || {};
  const score = attempt.points_scored || 0;
  const total = attempt.total_questions || exam.questions.length;
  const percentage = attempt.grade || ((score / total) * 100);

  const toggleQuestion = (index) => {
    setExpandedQuestion(expandedQuestion === index ? null : index);
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return styles.scoreExcellent;
    if (percentage >= 60) return styles.scoreGood;
    if (percentage >= 40) return styles.scoreAverage;
    return styles.scorePoor;
  };

  const renderChoiceLine = (c, idx, userIds, revealCorrect) => {
    const label = String.fromCharCode(65 + idx);
    const isSelected = userIds && userIds.includes(String(c.id));
    const isCorrect = !!c.is_correct;
    
    return (
      <div 
        key={c.id} 
        className={`${styles.choice} ${isSelected ? styles.selected : ""} ${isCorrect ? styles.correct : ""}`}
      >
        <div className={styles.label}>{label}.</div>
        <div className={styles.text} dangerouslySetInnerHTML={{__html: c.text_html}} />
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
          <div className={styles.scoreMain}>
            {Math.round(percentage)}%
          </div>
          <div className={styles.scoreSub}>
            {score} / {total} correct
          </div>
        </div>
      </div>

      <div className={styles.list}>
        {exam.questions.map((q, index) => {
          const uid = String(q.id);
          const userAns = answers[uid];
          let userIds = null;
          if (Array.isArray(userAns)) userIds = userAns.map(String);
          else if (userAns != null) userIds = [String(userAns)];
          else userIds = [];

          const isCorrect = q.choices 
            ? userIds.length === q.choices.filter(c => c.is_correct).length && 
              userIds.every(id => q.choices.find(c => String(c.id) === id)?.is_correct)
            : JSON.stringify(userAns) === JSON.stringify(q.special_correct_order || []);

          return (
            <div key={q.id} className={styles.q}>
              <div 
                className={`${styles.qheader} ${isCorrect ? styles.correctHeader : styles.incorrectHeader}`}
                onClick={() => toggleQuestion(index)}
              >
                <div className={styles.qtitleWrapper}>
                  <span className={styles.qnumber}>Q{index + 1}</span>
                  <span className={styles.qstatus}>
                    {isCorrect ? "✅ Correct" : "❌ Incorrect"}
                  </span>
                </div>
                <div className={styles.arrow}>
                  {expandedQuestion === index ? "▲" : "▼"}
                </div>
              </div>

              {expandedQuestion === index && (
                <div className={styles.qcontent}>
                  <div className={styles.qtitle} dangerouslySetInnerHTML={{__html: q.question_html || q.paragraph_html || ''}} />

                  {q.choices && q.choices.length > 0 && (
                    <div className={styles.choices}>
                      {q.choices.map((c, idx) => renderChoiceLine(c, idx, userIds, true))}
                    </div>
                  )}

                  {q.specialchoices && q.specialchoices.length > 0 && (
                    <div className={styles.specialWrap}>
                      <div className={styles.column}>
                        <strong>📋 Your Order</strong>
                        <ol>
                          {(userAns || []).map((id, i) => {
                            const sc = q.specialchoices.find(s => String(s.id) === String(id));
                            const correctIdAtPos = (q.special_correct_order || [])[i];
                            const match = String(correctIdAtPos) === String(id);
                            return (
                              <li key={id} className={match ? styles.match : styles.mismatch}>
                                <div dangerouslySetInnerHTML={{__html: sc ? sc.text_html : "—"}} />
                                {match ? <span className={styles.badgeCorrectSmall}>✓</span> : <span className={styles.badgeYourSmall}>✕</span>}
                              </li>
                            );
                          })}
                        </ol>
                      </div>

                      <div className={styles.column}>
                        <strong>🎯 Correct Order</strong>
                        <ol>
                          {(q.special_correct_order || []).map(id => {
                            const sc = q.specialchoices.find(s => s.id === id);
                            return <li key={id} dangerouslySetInnerHTML={{__html: sc ? sc.text_html : "—"}} />;
                          })}
                        </ol>
                      </div>
                    </div>
                  )}

                  {q.explanation_html && (
                    <div className={styles.explanation}>
                      <strong>💡 Explanation:</strong>
                      <div dangerouslySetInnerHTML={{__html: q.explanation_html}} />
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