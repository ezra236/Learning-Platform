import React, { useEffect, useState } from 'react';
import styles from './Format8.module.css';

export default function Format8({ question, mode, onAnswer, initialValue }) {
  const initialOrderedIds = (initialValue && initialValue.ordered) || [];
  const [ordered, setOrdered] = useState(() => {
    if (Array.isArray(initialOrderedIds)) {
      return initialOrderedIds.map(id => question.choices.find(c => c.id === id)).filter(Boolean);
    }
    return [];
  });

  const [pool, setPool] = useState(() => {
    const ids = new Set((ordered || []).map(o => o.id));
    return (question.choices || []).filter(c => !ids.has(c.id));
  });

  const [revealed, setRevealed] = useState(false);
  const [draggingOver, setDraggingOver] = useState(null);

  useEffect(() => {
    const initIds = (initialValue && initialValue.ordered) || [];
    if (Array.isArray(initIds) && initIds.length) {
      const newOrdered = initIds.map(id => question.choices.find(c => c.id === id)).filter(Boolean);
      setOrdered(newOrdered);
      const ids = new Set(newOrdered.map(o => o.id));
      setPool((question.choices || []).filter(c => !ids.has(c.id)));
    } else {
      setOrdered([]);
      setPool(question.choices ? [...question.choices] : []);
    }
    setRevealed(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question?.id, initialValue]);

  useEffect(() => {
    setPool((question.choices || []).filter(c => !ordered.find(o => o.id === c.id)));
  }, [ordered, question.choices]);

  useEffect(() => {
    onAnswer && onAnswer({ ordered: ordered.map(o => o.id) });
    if (mode === 'tutormode') {
      if (ordered.length === (question.choices || []).length) setRevealed(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ordered]);

  function onDragStart(e, id) {
    e.dataTransfer.setData('text/plain', String(id));
  }

  function onDropToOrder(e, index) {
    e.preventDefault();
    setDraggingOver(null);
    const id = Number(e.dataTransfer.getData('text/plain'));
    if (isNaN(id)) return;
    if (ordered.find(o => o.id === id)) return;
    const choice = (question.choices || []).find(c => c.id === id);
    if (!choice) return;
    setOrdered(prev => {
      const copy = prev.slice();
      copy.splice(index, 0, choice);
      return copy;
    });
  }

  function removeFromOrdered(index) {
    const removed = ordered[index];
    setOrdered(prev => prev.filter((_, i) => i !== index));
    setPool(prev => [...prev, removed]);
  }

  const showButton = mode !== 'exammode';
  const correctOrderChoices = getCorrectOrderChoices(question);

  function getCorrectOrderChoices(q) {
    const withOrder = (q.choices || []).filter(c => c.correct_order !== null && c.correct_order !== undefined);
    if (withOrder.length > 0) {
      return withOrder.slice().sort((a,b) => Number(a.correct_order || 0) - Number(b.correct_order || 0));
    }
    const withDisplay = (q.choices || []).filter(c => c.display_order !== null && c.display_order !== undefined);
    if (withDisplay.length > 0) {
      return withDisplay.slice().sort((a,b) => Number(a.display_order || 0) - Number(b.display_order || 0));
    }
    return q.choices || [];
  }

  // Build an arrowed sequence as HTML: "A → B → C"
  function buildArrowSequence(choices) {
    if (!choices || choices.length === 0) return '';
    // render each as "A. <text>" but preserve TinyMCE styling for text
    return choices.map((c, i) => {
      return `<span class="${styles.arrowItem}"><strong>${c.label}</strong>. <span class="${styles.arrowText}">${c.text}</span></span>`;
    }).join(' <span class="${styles.arrowIcon}">→</span> ');
  }

  const arrowSequenceHtml = buildArrowSequence(correctOrderChoices);

  return (
    <div className={styles.container}>
      {question.question_text ? (
        <div className={styles.questionText} dangerouslySetInnerHTML={{ __html: question.question_text }} />
      ) : null}

      {question.image_url ? (
        <div className={styles.imageWrapper}>
          <img src={question.image_url} alt="question" className={styles.questionImage} />
        </div>
      ) : null}

      <div className={styles.mainPanels}>
        <div className={styles.choicesPanel}>
          <h4 className={styles.panelTitle}>🎯 Available Choices</h4>
          <div className={styles.choicesList}>
            {(pool || []).map(c => (
              <div
                key={c.id}
                draggable
                onDragStart={(e) => onDragStart(e, c.id)}
                className={styles.choiceItem}
              >
                <div className={styles.choiceLabel}>{c.label}</div>
                <div
                  className={styles.choiceText}
                  dangerouslySetInnerHTML={{ __html: c.text }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className={styles.orderPanel}>
          <h4 className={styles.panelTitle}>📋 Place in Correct Order</h4>
          <div className={styles.orderContainer}>
            {Array.from({ length: (question.choices || []).length }).map((_, idx) => {
              const item = ordered[idx];
              const isEmpty = !item;

              return (
                <div
                  key={idx}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDraggingOver(idx);
                  }}
                  onDragLeave={() => setDraggingOver(null)}
                  onDrop={(e) => onDropToOrder(e, idx)}
                  className={`${styles.orderSlot} ${isEmpty ? styles.empty : ''} ${draggingOver === idx ? styles.draggingOver : ''}`}
                >
                  {item ? (
                    <div className={styles.orderedItem}>
                      <div className={styles.orderedContent}>
                        <div className={styles.orderNumber}>{idx + 1}</div>
                        <div>
                          <strong>{item.label}</strong>. <span dangerouslySetInnerHTML={{ __html: item.text }} />
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromOrdered(idx)}
                        className={styles.removeButton}
                        type="button"
                      >
                        ✕ Remove
                      </button>
                    </div>
                  ) : (
                    <div className={styles.emptySlotText}>⬇️ Drop item here</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className={styles.controlsPanel}>
        {showButton && !revealed && (
          <button
            className={styles.revealButton}
            onClick={() => setRevealed(true)}
            type="button"
          >
            🔍 Show Correct Order
          </button>
        )}

        {revealed && (
          <div className={styles.answerSection}>
            <h4 className={styles.answerTitle}>✅ Correct Order</h4>

            {/* Arrowed inline sequence */}
            <div className={styles.arrowSequence} dangerouslySetInnerHTML={{ __html: arrowSequenceHtml }} />

            {/* Numbered breakdown as well, with arrows */}
            <ol className={styles.correctOrderList}>
              {correctOrderChoices.map((c, idx) => (
                <li key={c.id} className={styles.correctOrderItem}>
                  <div className={styles.orderIndex}>{idx + 1}</div>
                  <div>
                    <strong>{c.label}</strong>. <span dangerouslySetInnerHTML={{ __html: c.text }} />
                  </div>
                </li>
              ))}
            </ol>

            <h4 className={styles.explanationTitle}>💡 Explanation</h4>
            <div
              className={styles.explanationText}
              dangerouslySetInnerHTML={{ __html: question.explanation || 'No explanation provided.' }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
