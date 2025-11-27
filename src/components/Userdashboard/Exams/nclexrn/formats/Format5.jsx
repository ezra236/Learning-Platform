import React, { useEffect, useState } from 'react';
import styles from './Format5.module.css';

export default function Format5({ question, mode, onAnswer, initialValue }) {
  const [rows, setRows] = useState(() => {
    const initRows = (question.choices || []).reduce((acc, c) => {
      acc[String(c.id)] = (initialValue && initialValue.rows && initialValue.rows[String(c.id)]) || 'none';
      return acc;
    }, {});
    return initRows;
  });
  const [activeCaseIndex, setActiveCaseIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const cases = question.cases || [];

  useEffect(() => { 
    if (initialValue && initialValue.rows) setRows(initialValue.rows); 
  }, [initialValue]);
  
  useEffect(() => { 
    onAnswer && onAnswer({ rows }); 
    if (mode === 'tutormode') { 
      const allSelected = Object.values(rows).every(v => v === 'correct' || v === 'wrong'); 
      if (allSelected) setRevealed(true); 
    } 
  }, [rows]);

  function setRow(choiceId, value) {
    setRows(prev => ({ ...prev, [String(choiceId)]: value }));
  }

  const showButton = mode !== 'exammode';

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
              <span className={styles.caseHeading} dangerouslySetInnerHTML={{ __html: c.heading || '' }} />
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
        
        {/* Interactive selection table: no A/B/C/D label column */}
        <table className={styles.table}>
          <thead>
            <tr>
              <th>
                <span>📋 </span>
                <span dangerouslySetInnerHTML={{ __html: question.heading1 || 'Choice' }} />
              </th>
              <th style={{ textAlign: 'center' }}>
                <span>✅ </span>
                <span dangerouslySetInnerHTML={{ __html: question.heading2 || 'Correct' }} />
              </th>
              <th style={{ textAlign: 'center' }}>
                <span>❌ </span>
                <span dangerouslySetInnerHTML={{ __html: question.heading3 || 'Wrong' }} />
              </th>
            </tr>
          </thead>
          <tbody>
            {(question.choices || []).map((c) => (
              <tr key={c.id}>
                {/* Choice text spans full first column (no label cell) */}
                <td className={styles.choiceCell}>
                  <div 
                    className={styles.choiceText}
                    dangerouslySetInnerHTML={{__html: c.text}} 
                  />
                </td>
                <td className={styles.radioCell}>
                  <input 
                    type="radio" 
                    name={`row-${c.id}`} 
                    checked={rows[String(c.id)] === 'correct'} 
                    onChange={() => setRow(c.id, 'correct')}
                    className={styles.radioInput}
                  />
                </td>
                <td className={styles.radioCell}>
                  <input 
                    type="radio" 
                    name={`row-${c.id}`} 
                    checked={rows[String(c.id)] === 'wrong'} 
                    onChange={() => setRow(c.id, 'wrong')}
                    className={styles.radioInput}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

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
              ✅ Correct / Wrong Mapping
            </h4>

            {/* Revealed answer table: no label column, show ticks in correct/wrong columns */}
            <table className={styles.answerTable}>
              <thead>
                <tr>
                  <th>
                    <span>📋 </span>
                    <span dangerouslySetInnerHTML={{ __html: question.heading1 || 'Choice' }} />
                  </th>
                  <th style={{ textAlign: 'center' }}>
                    <span>✅ </span>
                    <span dangerouslySetInnerHTML={{ __html: question.heading2 || 'Correct' }} />
                  </th>
                  <th style={{ textAlign: 'center' }}>
                    <span>❌ </span>
                    <span dangerouslySetInnerHTML={{ __html: question.heading3 || 'Wrong' }} />
                  </th>
                </tr>
              </thead>
              <tbody>
                {(question.choices || []).map(c => (
                  <tr key={c.id}>
                    <td className={styles.choiceCell}>
                      <div 
                        className={styles.choiceText}
                        dangerouslySetInnerHTML={{__html: c.text}} 
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {c.is_correct ? <span className={styles.correctTick}>✔️</span> : ''}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {c.is_correct ? '' : <span className={styles.incorrectTick}>❌</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

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
