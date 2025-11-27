import React, { useEffect, useRef, useState } from 'react';
import styles from './Format7.module.css';

// helper to extract plain label text for option display
function stripHtml(html) {
  if (!html) return '';
  const d = new DOMParser().parseFromString(html, 'text/html');
  return d.body.textContent || '';
}

export default function Format7({ question, mode, onAnswer, initialValue }) {
  const initialBlanks = (initialValue && initialValue.blanks) || {};
  const [blanks, setBlanks] = useState(() => {
    const out = {};
    Object.entries(initialBlanks).forEach(([k, v]) => out[k] = (typeof v === 'string' && /^\d+$/.test(v)) ? Number(v) : v);
    return out;
  });

  const [revealed, setRevealed] = useState(false);
  const [activeCaseIndex, setActiveCaseIndex] = useState(0);
  const containerRef = useRef(null);

  const paragraph = question.paragraph || '';
  const cases = question.cases || [];

  // count placeholders
  const dropdownCount = Math.max(0, (question.question_text || '').match(/{{\s*dropdown\s*}}/gi)?.length || 0);

  useEffect(() => {
    onAnswer && onAnswer({ blanks });
    if (mode === 'tutormode') {
      const filled = Object.keys(blanks).length;
      if (dropdownCount > 0 && filled === dropdownCount) setRevealed(true);
    }
  }, [blanks, mode, onAnswer, dropdownCount]);

  function onSelectChange(idx, value) {
    const val = value === '' ? '' : Number(value);
    setBlanks(prev => ({ ...prev, [String(idx)]: val }));
  }

  // inject selects into placeholders while preserving the original TinyMCE HTML
  useEffect(() => {
    const raw = question.question_text || '';
    let i = 0;
    const replaced = raw.replace(/{{\s*dropdown\s*}}/gi, () => `<span class="__dropdown_placeholder" data-index="${i++}"></span>`);
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = replaced;

    const placeholders = container.querySelectorAll('.__dropdown_placeholder');
    placeholders.forEach((ph) => {
      const idx = ph.getAttribute('data-index');
      ph.innerHTML = '';

      const select = document.createElement('select');
      select.className = `${styles.select} __inserted_dropdown`;
      const opt0 = document.createElement('option');
      opt0.value = '';
      opt0.textContent = '🔽 Select';
      select.appendChild(opt0);

      (question.choices || []).forEach(c => {
        const opt = document.createElement('option');
        opt.value = String(c.id);
        opt.textContent = `${c.label}. ${stripHtml(c.text)}`;
        if (blanks[String(idx)] !== undefined && String(blanks[String(idx)]) === String(c.id)) {
          opt.selected = true;
        }
        select.appendChild(opt);
      });

      select.addEventListener('change', (e) => {
        onSelectChange(idx, e.target.value);
      });

      ph.style.display = 'inline-block';
      ph.style.verticalAlign = 'middle';
      ph.appendChild(select);
    });

    return () => {
      const placeholdersCleanup = container.querySelectorAll('.__dropdown_placeholder');
      placeholdersCleanup.forEach(ph => {
        const sel = ph.querySelector('select');
        if (sel) {
          const clone = sel.cloneNode(true);
          ph.replaceChild(clone, sel);
        }
      });
    };
  }, [question.question_text, JSON.stringify(question.choices || []), JSON.stringify(blanks)]);

  // prepare mapping of nth correct choice -> nth dropdown
  const correctChoicesOrdered = (question.choices || []).filter(c => c.is_correct);
  function mapCorrectsToDropdowns() {
    const mapping = [];
    for (let i = 0; i < dropdownCount; i++) {
      const correct = correctChoicesOrdered[i];
      if (correct) mapping.push({ dropdownIndex: i, choice: correct });
      else mapping.push({ dropdownIndex: i, choice: null });
    }
    return mapping;
  }

  const showButton = mode !== 'exammode';

  return (
    <div className={styles.container}>
      <div className={styles.leftPanel}>
        {/* paragraph */}
        {paragraph ? (
          <div className={styles.paragraph} dangerouslySetInnerHTML={{ __html: paragraph }} />
        ) : null}

        {/* case headings */}
        {cases.length > 0 && (
          <div className={styles.caseNavigation}>
            {cases.map((c, idx) => (
              <button
                key={idx}
                type="button"
                className={`${styles.caseButton} ${activeCaseIndex === idx ? styles.active : ''}`}
                onClick={() => setActiveCaseIndex(idx)}
              >
                {/* render heading HTML exactly as saved in TinyMCE */}
                <span dangerouslySetInnerHTML={{ __html: c.heading || '' }} />
              </button>
            ))}
          </div>
        )}

        {/* case text for active case */}
        <div className={styles.caseContent}>
          {cases[activeCaseIndex] ? (
            <div dangerouslySetInnerHTML={{ __html: cases[activeCaseIndex].case_text }} />
          ) : (
            <div className={styles.noCaseText}>📝 No case text available</div>
          )}
        </div>
      </div>

      <div className={styles.rightPanel}>
        {/* question rendered exactly as saved, with inline injected selects */}
        <div className={styles.questionContainer}>
          <div ref={containerRef} />
        </div>

        {showButton && !revealed && (
          <button className={styles.revealButton} onClick={() => setRevealed(true)} type="button">
            🔍 Show Answer
          </button>
        )}

        {revealed && (
          <div className={styles.answerSection}>
            <h4 className={styles.answerTitle}>✅ Correct Answer (per dropdown)</h4>

            <div className={styles.dropdownAnswerList}>
              {mapCorrectsToDropdowns().map((m, idx) => (
                <div key={idx} className={styles.dropdownAnswer}>
                  <div className={styles.dropdownAnswerTitle}>Dropdown {idx + 1} →</div>
                  <div className={styles.dropdownAnswerContent}>
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
    </div>
  );
}
