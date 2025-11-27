import React, { useEffect, useRef, useState } from 'react';
import styles from './Format2.module.css';

export default function Format2({ question, mode, onAnswer, initialValue }) {
  const [value, setValue] = useState((initialValue && initialValue.blanks && initialValue.blanks['0']) || '');
  const [revealed, setRevealed] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const initial = (initialValue && initialValue.blanks && initialValue.blanks['0']) || '';
    setValue(initial);
    if (inputRef.current) inputRef.current.value = initial;
  }, [initialValue]);

  useEffect(() => {
    onAnswer && onAnswer({ blanks: { '0': value } });
    if (mode === 'tutormode' && value) setRevealed(true);
  }, [value]);

  useEffect(() => {
    const html = (question.question_text || '').split('{{answer}}').map((part, idx, arr) => {
      return idx < arr.length - 1 ? `${part}<span data-blank="${idx}"></span>` : part;
    }).join('');
    
    const container = containerRef.current;
    if (!container) return;
    
    container.innerHTML = html;
    const placeholders = container.querySelectorAll('span[data-blank]');
    
    placeholders.forEach((span) => {
      span.innerHTML = '';
      const inp = document.createElement('input');
      inp.type = 'text';
      inp.className = styles.blankInput;
      inp.placeholder = 'Type your answer here...';
      inp.value = value || '';
      inp.addEventListener('input', (e) => setValue(e.target.value));
      span.appendChild(inp);
      inputRef.current = inp;
    });
  }, [question.question_text]);

  const showButton = mode !== 'exammode';

  return (
    <div className={styles.container}>
      <div 
        ref={containerRef}
        className={styles.questionContainer}
      />
      
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
            ✅ Correct Answer
          </h4>
          <div 
            className={styles.correctAnswer}
            dangerouslySetInnerHTML={{ __html: question.blank_answer || 'No answer provided.' }} 
          />
          
          <h4 className={styles.explanationTitle}>
            💡 Explanation
          </h4>
          <div 
            className={styles.explanationText}
            dangerouslySetInnerHTML={{ __html: question.explanation || 'No explanation provided.' }} 
          />
        </div>
      )}
    </div>
  );
}


