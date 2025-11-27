import React, { useEffect, useState } from 'react';
import styles from './Format6.module.css';

const letters = ['A','B','C','D','E','F'];

export default function Format6({ question, mode, onAnswer, initialValue }) {
  const [selected, setSelected] = useState((initialValue && initialValue.selected_choices) || []);
  const [activeCaseIndex, setActiveCaseIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const cases = question.cases || [];

  useEffect(() => { 
    setSelected((initialValue && initialValue.selected_choices) || []); 
  }, [initialValue]);
  
  useEffect(() => { 
    onAnswer && onAnswer({ selected_choices: selected }); 
    if (mode === 'tutormode' && selected.length) setRevealed(true); 
  }, [selected]);

  function toggle(id) { 
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]); 
  }

  const showButton = mode !== 'exammode';
  const correctChoices = (question.choices || []).filter(c => c.is_correct);

  return (
    <div className={styles.container}>
      <div className={styles.casePanel}>
        <div 
          className={styles.paragraph}
          dangerouslySetInnerHTML={{__html: question.paragraph || ''}} 
        />
        
        <div className={styles.caseNavigation}>
          {cases.map((c, idx) => (
            <button 
              key={idx}
              onClick={() => setActiveCaseIndex(idx)}
              className={`${styles.caseButton} ${activeCaseIndex === idx ? styles.active : ''}`}
              type="button"
            >
              {/* render heading HTML exactly as saved in TinyMCE */}
              <span dangerouslySetInnerHTML={{ __html: c.heading || '' }} />
            </button>
          ))}
        </div>
        
        <div className={styles.caseContent}>
          {cases[activeCaseIndex] ? (
            <div dangerouslySetInnerHTML={{__html: cases[activeCaseIndex].case_text}} />
          ) : (
            <div style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
              📝 No case text available
            </div>
          )}
        </div>
      </div>

      <div className={styles.questionPanel}>
        <div 
          className={styles.questionText}
          dangerouslySetInnerHTML={{__html: question.question_text}} 
        />
        
        <div className={styles.choicesContainer}>
          {(question.choices || []).map((c, idx) => (
            <div 
              key={c.id}
              className={`${styles.choiceItem} ${selected.includes(c.id) ? styles.selected : ''}`}
              onClick={() => toggle(c.id)}
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
            type="button"
          >
            🔍 Show Answer
          </button>
        )}

        {revealed && (
          <div className={styles.answerSection}>
            <h4 className={styles.answerTitle}>
              ✅ Correct Choices
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
    </div>
  );
}
