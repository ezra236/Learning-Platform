import React, { useEffect, useRef, useState } from 'react';
import styles from './Format3.module.css';

export default function Format3({ question, mode, onAnswer, initialValue }) {
  // number of blanks in the stored question_text
  const tokenCount = (question.question_text && (question.question_text.match(/{{answer}}/g) || []).length) || 0;

  // blanks stored as { "0": choiceId, "1": choiceId, ... }
  const [blanks, setBlanks] = useState(() => {
    const init = (initialValue && initialValue.blanks) || {};
    const norm = {};
    Object.entries(init).forEach(([k, v]) => norm[k] = (typeof v === 'string' && /^\d+$/.test(v)) ? Number(v) : v);
    return norm;
  });

  const [revealed, setRevealed] = useState(false);
  const containerRef = useRef(null);
  const [draggingOver, setDraggingOver] = useState(null);

  // When blanks change notify parent and handle tutor auto-reveal
  useEffect(() => {
    onAnswer && onAnswer({ blanks });
    if (mode === 'tutormode') {
      const filled = Object.values(blanks).filter(Boolean).length;
      if (tokenCount > 0 && filled === tokenCount) setRevealed(true);
    }
  }, [blanks, mode, onAnswer, tokenCount]);

  // build the HTML with placeholder spans for blanks
  useEffect(() => {
    const html = (question.question_text || '').split('{{answer}}').map((part, idx, arr) =>
      idx < arr.length - 1 ? `${part}<span data-blank="${idx}"></span>` : part
    ).join('');

    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = html;

    const placeholders = container.querySelectorAll('span[data-blank]');

    placeholders.forEach(span => {
      const i = parseInt(span.getAttribute('data-blank'), 10);
      span.innerHTML = ''; // clear any previous content

      const drop = document.createElement('div');
      drop.className = styles.dropZone;

      const assignedChoiceId = blanks[i];
      const assignedChoice = assignedChoiceId ? (question.choices || []).find(c => Number(c.id) === Number(assignedChoiceId)) : null;

      if (assignedChoice) {
        // SHOW ONLY THE ANSWER TEXT IN THE DROP ZONE
        drop.innerHTML = `<div class="${styles.dropContent}">${assignedChoice.text}</div>`;
      } else {
        drop.innerHTML = `<div class="${styles.dropPlaceholder}">🎯 Drop here</div>`;
      }

      // dragover: show preview of dragged choice while cursor is over zone
      const onDragOver = (e) => {
        e.preventDefault();
        setDraggingOver(i);
        // try to read from dataTransfer; fallback to global var
        const idStr = e.dataTransfer && e.dataTransfer.getData ? e.dataTransfer.getData('text/plain') : '';
        let id = Number(idStr);
        if (isNaN(id)) id = window.__nclex_draggedChoiceId || NaN;
        if (!isNaN(id)) {
          const choice = (question.choices || []).find(c => Number(c.id) === Number(id));
          if (choice) {
            // preview ONLY the choice.text (preserve TinyMCE styling)
            drop.innerHTML = `<div class="${styles.dropPreview}">${choice.text}</div>`;
          }
        } else {
          // if nothing dragged, show assigned or placeholder
          if (assignedChoice) {
            drop.innerHTML = `<div class="${styles.dropContent}">${assignedChoice.text}</div>`;
          } else {
            drop.innerHTML = `<div class="${styles.dropPlaceholder}">🎯 Drop here</div>`;
          }
        }
      };

      const onDragLeave = () => {
        setDraggingOver(null);
        // restore assignedChoice or placeholder
        if (assignedChoice) {
          drop.innerHTML = `<div class="${styles.dropContent}">${assignedChoice.text}</div>`;
        } else {
          drop.innerHTML = `<div class="${styles.dropPlaceholder}">🎯 Drop here</div>`;
        }
      };

      const onDrop = (e) => {
        e.preventDefault();
        setDraggingOver(null);
        // prefer dataTransfer, fallback to window var
        const idStr = e.dataTransfer && e.dataTransfer.getData ? e.dataTransfer.getData('text/plain') : '';
        let id = Number(idStr);
        if (isNaN(id)) id = window.__nclex_draggedChoiceId || NaN;
        if (!isNaN(id)) {
          setBlanks(prev => ({ ...prev, [i]: id }));
        }
      };

      // clicking/dblclick clears a dropped choice
      const onDoubleClick = () => {
        setBlanks(prev => {
          const copy = { ...prev };
          delete copy[i];
          return copy;
        });
      };

      drop.addEventListener('dragover', onDragOver);
      drop.addEventListener('dragenter', onDragOver);
      drop.addEventListener('dragleave', onDragLeave);
      drop.addEventListener('drop', onDrop);
      drop.addEventListener('dblclick', onDoubleClick);

      // append drop zone
      span.appendChild(drop);

      // cleanup when effect re-runs (important to avoid duplicates)
      // note: will be cleaned by re-rendering container entirely on next effect run
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.question_text, question.choices, blanks, draggingOver]);

  const showButton = mode !== 'exammode';
  const correctChoicesOrdered = (question.choices || []).filter(c => c.is_correct);

  function mapCorrectsToBlanks() {
    const mapping = [];
    for (let i = 0; i < tokenCount; i++) {
      const correct = correctChoicesOrdered[i];
      mapping.push({ blankIndex: i, choice: correct || null });
    }
    return mapping;
  }

  return (
    <div className={styles.container}>
      <div
        ref={containerRef}
        className={styles.questionContainer}
      />

      <div className={styles.choicesSection}>
        <div className={styles.choicesTitle}>🎯 Drag choices into blanks</div>
        <div className={styles.choicesGrid}>
          {(question.choices || []).map(c => (
            <div
              key={c.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer && e.dataTransfer.setData && e.dataTransfer.setData('text/plain', String(c.id));
                // cross-browser reliable preview: keep a global pointer
                window.__nclex_draggedChoiceId = c.id;
              }}
              onDragEnd={() => {
                // clear global pointer on drag end
                window.__nclex_draggedChoiceId = null;
              }}
              className={styles.choiceItem}
            >
              <div className={styles.choiceLabel}>{c.label}</div>
              <div className={styles.choiceText} dangerouslySetInnerHTML={{ __html: c.text }} />
            </div>
          ))}
        </div>
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
          <h4 className={styles.answerTitle}>✅ Correct Answer (per blank)</h4>
          <div className={styles.blankAnswer}>
            {mapCorrectsToBlanks().map((m, idx) => (
              <div key={idx} className={styles.blankAnswerItem}>
                <div className={styles.blankAnswerTitle}>Blank {idx + 1} →</div>
                <div className={styles.blankAnswerContent}>
                  {m.choice ? (
                    <>
                      <strong>{m.choice.label}</strong>. <span dangerouslySetInnerHTML={{ __html: m.choice.text }} />
                    </>
                  ) : (
                    <em>Unknown</em>
                  )}
                </div>
              </div>
            ))}
          </div>

          <h4 className={styles.explanationTitle}>💡 Explanation</h4>
          <div className={styles.explanationText} dangerouslySetInnerHTML={{ __html: question.explanation || 'No explanation provided.' }} />
        </div>
      )}
    </div>
  );
}
