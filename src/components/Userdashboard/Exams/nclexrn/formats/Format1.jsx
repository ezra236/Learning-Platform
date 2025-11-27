import React, { useEffect, useState } from 'react';
import styles from './Format1.module.css';

const letters = ['A','B','C','D','E','F'];

export default function Format1({ question, mode, onAnswer, initialValue }) {
  const [selected, setSelected] = useState((initialValue && initialValue.selected_choices) || []);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => { 
    setSelected((initialValue && initialValue.selected_choices) || []); 
  }, [initialValue]);
  
  useEffect(() => { 
    onAnswer && onAnswer({ selected_choices: selected }); 
    if (mode === 'tutormode' && selected.length) setRevealed(true); 
  }, [selected]);

  function toggleChoice(id) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  const showButton = mode !== 'exammode';
  const correctChoices = (question.choices || []).filter(c => c.is_correct);

  return (
    <div className={styles.container}>
      <div 
        className={styles.questionText}
        dangerouslySetInnerHTML={{__html: question.question_text}} 
      />
      
      <div className={styles.choicesContainer}>
        {(question.choices || []).map((c, idx) => (
          <div 
            key={c.id}
            className={`${styles.choiceItem} ${selected.includes(c.id) ? styles.selected : ''}`}
            onClick={() => toggleChoice(c.id)}
          >
            <div className={styles.choiceLabel}>
              {letters[idx] || '?'}
            </div>
            <div className={styles.choiceContent}>
              <div 
                className={styles.choiceText}
                dangerouslySetInnerHTML={{__html: c.text}} 
              />
              {selected.includes(c.id) && (
                <div className={styles.yourAnswerBadge}>
                  ✅ Your Answer
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showButton && !revealed && (
        <button 
          className={styles.revealButton}
          onClick={() => setRevealed(true)}
        >
          🔍 Show Answer
        </button>
      )}

      {revealed && (
        <div className={styles.answerSection}>
          <h4 className={styles.answerTitle}>
            ✅ Correct Answer{correctChoices.length > 1 ? 's' : ''}
          </h4>
          <ul className={styles.correctAnswersList}>
            {correctChoices.map(c => (
              <li key={c.id} className={styles.correctAnswerItem}>
                <strong>{c.label}</strong>. <span dangerouslySetInnerHTML={{__html: c.text}} />
              </li>
            ))}
          </ul>
          
          <h4 className={styles.explanationTitle}>
            💡 Explanation
          </h4>
          <div 
            className={styles.explanationText}
            dangerouslySetInnerHTML={{__html: question.explanation || 'No explanation provided.'}} 
          />
        </div>
      )}
    </div>
  );
}