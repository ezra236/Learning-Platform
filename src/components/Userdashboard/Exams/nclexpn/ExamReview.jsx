import React from 'react';
import styles from './ExamReview.module.css';

function renderUserAnswer(q, sel) {
  if (!sel) return <div className={styles.noAnswer}>📭 No answer provided</div>;

  // multiple choice
  if (sel.selected_choices && Array.isArray(sel.selected_choices)) {
    if (sel.selected_choices.length === 0) return <div className={styles.noAnswer}>📭 No answer selected</div>;
    return (
      <div>
        { sel.selected_choices.map((cid) => {
          const ch = (q.choices || []).find(c => Number(c.id) === Number(cid));
          if (!ch) return <div key={cid}>❓ Unknown choice</div>;
          return (
            <div key={cid} style={{ marginBottom: '8px', padding: '8px', background: '#fff', borderRadius: '6px' }}>
              <strong>🔹 {ch.label}</strong>. <span dangerouslySetInnerHTML={{__html: ch.text}} />
            </div>
          );
        }) }
      </div>
    );
  }

  // blanks (single or multi)
  if (sel.blanks) {
    const entries = Object.entries(sel.blanks);
    if (entries.length === 0) return <div className={styles.noAnswer}>📭 No blanks filled</div>;
    return (
      <div>
        { entries.map(([k,v]) => {
          if (typeof v === 'number' || (typeof v === 'string' && /^\d+$/.test(v + ''))) {
            const nv = Number(v);
            const ch = (q.choices || []).find(c => Number(c.id) === nv);
            if (!ch) return <div key={k}>❓ Unknown choice</div>;
            return (
              <div key={k} style={{ marginBottom: '8px', padding: '8px', background: '#fff', borderRadius: '6px' }}>
                <strong>🔸 Blank {parseInt(k) + 1}:</strong> <strong>{ch.label}</strong>. <span dangerouslySetInnerHTML={{__html: ch.text}} />
              </div>
            );
          } else {
            return (
              <div key={k} style={{ marginBottom: '8px', padding: '8px', background: '#fff', borderRadius: '6px' }}>
                <strong>🔸 Blank {parseInt(k) + 1}:</strong> {String(v)}
              </div>
            );
          }
        })}
      </div>
    );
  }

  // rows mapping (format5) - render headings as HTML
  if (sel.rows) {
    return (
      <table className={styles.table}>
        <thead>
          <tr>
            <th>
              <span>📋 </span>
              <span dangerouslySetInnerHTML={{ __html: q.heading1 || 'Choice' }} />
            </th>
            <th style={{ textAlign: 'center' }}>
              <span dangerouslySetInnerHTML={{ __html: q.heading2 || 'Correct' }} />
            </th>
            <th style={{ textAlign: 'center' }}>
              <span dangerouslySetInnerHTML={{ __html: q.heading3 || 'Wrong' }} />
            </th>
          </tr>
        </thead>
        <tbody>
          { (q.choices || []).map(c => (
            <tr key={c.id}>
              <td><strong>{c.label}</strong>. <span dangerouslySetInnerHTML={{__html:c.text}} /></td>
              <td style={{ textAlign: 'center' }}>{ sel.rows[String(c.id)] === 'correct' ? '✔️' : '' }</td>
              <td style={{ textAlign: 'center' }}>{ sel.rows[String(c.id)] === 'wrong' ? '❌' : '' }</td>
            </tr>
          )) }
        </tbody>
      </table>
    );
  }

  // bowtie (format 9) -- user answer rendering
  if (sel.bowtie) {
    const b = sel.bowtie;
    const actions = q.actions || [];
    const potentials = q.potentials || [];
    const parameters = q.parameters || [];

    function findAction(id) { return actions.find(a => Number(a.id) === Number(id)); }
    function findPotential(id) { return potentials.find(p => Number(p.id) === Number(id)); }
    function findParameter(id) { return parameters.find(p => Number(p.id) === Number(id)); }

    return (
      <div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontWeight: 400, marginBottom: 6 }}>🔹 Actions placed</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[0,1].map(i => {
              const id = (b.actions && b.actions[i]) ?? null;
              if (!id) return <div key={i} className={styles.noAnswer}>Slot {i+1}: —</div>;
              const a = findAction(id);
              if (!a) return <div key={i}>❓ Unknown action</div>;
              return (
                <div key={i} style={{ padding: 8, background: '#fff', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 13, color: '#059669', fontWeight:400 }}>Action {i+1}</div>
                  <div><strong>{a.label}</strong>. <span dangerouslySetInnerHTML={{__html: a.text}} /></div>
                  {a.is_correct ? <div style={{ marginTop: 6 }}>✅ Correct</div> : <div style={{ marginTop: 6 }}>❌ Incorrect</div>}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontWeight: 400, marginBottom: 6 }}>🔸 Potential placed</div>
          { b.potential ? (() => {
            const p = findPotential(b.potential);
            if (!p) return <div>❓ Unknown potential</div>;
            return (
              <div style={{ padding: 8, background: '#fff', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 13, color: '#059669', fontWeight:400 }}>Potential</div>
                <div><strong>{p.label}</strong>. <span dangerouslySetInnerHTML={{__html: p.text}} /></div>
                {p.is_correct ? <div style={{ marginTop: 6 }}>✅ Correct</div> : <div style={{ marginTop: 6 }}>❌ Incorrect</div>}
              </div>
            );
          })() : <div className={styles.noAnswer}>No potential placed</div>}
        </div>

        <div>
          <div style={{ fontWeight: 400, marginBottom: 6 }}>🔹 Parameters placed</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[0,1].map(i => {
              const id = (b.parameters && b.parameters[i]) ?? null;
              if (!id) return <div key={i} className={styles.noAnswer}>Slot {i+1}: —</div>;
              const p = findParameter(id);
              if (!p) return <div key={i}>❓ Unknown parameter</div>;
              return (
                <div key={i} style={{ padding: 8, background: '#fff', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 13, color: '#059669', fontWeight:400 }}>Parameter {i+1}</div>
                  <div><strong>{p.label}</strong>. <span dangerouslySetInnerHTML={{__html: p.text}} /></div>
                  {p.is_correct ? <div style={{ marginTop: 6 }}>✅ Correct</div> : <div style={{ marginTop: 6 }}>❌ Incorrect</div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ordered (format8)
  if (sel.ordered && Array.isArray(sel.ordered)) {
    if (sel.ordered.length === 0) return <div className={styles.noAnswer}>📭 No ordering provided</div>;
    return (
      <ol className={styles.orderedList}>
        { sel.ordered.map(cid => {
          const ch = (q.choices || []).find(c => Number(c.id) === Number(cid));
          if (!ch) return <li key={cid}>❓ Unknown item</li>;
          return (
            <li key={cid}>
              <strong>{ch.label}</strong>. <span dangerouslySetInnerHTML={{__html:ch.text}} />
            </li>
          );
        }) }
      </ol>
    );
  }

  return <div className={styles.noAnswer}>📭 No answer data available</div>;
}

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

// helper that replaces tokens with a long dash
function renderQuestionHtmlReplacingTokens(question_text) {
  if (!question_text) return '';
  // replace tokens like {{answer}} or {{ dropdown }} with long dash
  return String(question_text)
    .replace(/{{\s*dropdown\s*}}/gi, '___________________')
    .replace(/{{\s*answer\s*}}/gi, '___________________');
}

export default function ExamReview({ attempt, exam, onClose }) {
  const selected = attempt?.selected_choices || {};

  return (
    <div className={styles.reviewPanel}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>📊 Exam Review</h2>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        { exam.questions.map((q, idx) => {
          const sel = selected[String(q.id)] || null;

          // prepare correct-answer rendering for format 5: table with ticks (headings rendered as HTML)
          const correctTableForFormat5 = (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>
                    <span>📋 </span>
                    <span dangerouslySetInnerHTML={{ __html: q.heading1 || 'Choice' }} />
                  </th>
                  <th style={{ textAlign: 'center' }}>
                    <span dangerouslySetInnerHTML={{ __html: q.heading2 || 'Correct' }} />
                  </th>
                  <th style={{ textAlign: 'center' }}>
                    <span dangerouslySetInnerHTML={{ __html: q.heading3 || 'Wrong' }} />
                  </th>
                </tr>
              </thead>
              <tbody>
                { (q.choices || []).map(c => (
                  <tr key={c.id}>
                    <td><strong>{c.label}</strong>. <span dangerouslySetInnerHTML={{__html:c.text}}/></td>
                    <td style={{ textAlign: 'center' }}>{ c.is_correct ? <span className={styles.correctTick}>✔️</span> : '' }</td>
                    <td style={{ textAlign: 'center' }}>{ c.is_correct ? '' : <span className={styles.correctTick}>❌</span> }</td>
                  </tr>
                )) }
              </tbody>
            </table>
          );

          // render question_text with tokens replaced by long dash
          const renderedQuestionHtml = renderQuestionHtmlReplacingTokens(q.question_text || '');

          // For format 9 prepare correct lists
          const correctActions = (q.actions || []).filter(a => a.is_correct);
          const correctPotentials = (q.potentials || []).filter(p => p.is_correct);
          const correctParameters = (q.parameters || []).filter(p => p.is_correct);

          return (
            <div key={q.id} className={styles.questionItem}>
              <div className={styles.questionHeader}>
                <div className={styles.questionNumber}>
                  📝 Question {idx + 1}
                </div>
              </div>

              <div 
                className={styles.questionText}
                dangerouslySetInnerHTML={{ __html: renderedQuestionHtml }} 
              />

              <div className={`${styles.answerSection} ${styles.userAnswer}`}>
                <div className={styles.answerTitle}>
                  👤 Your Answer:
                </div>
                <div style={{ marginTop: '8px' }}>
                  { renderUserAnswer(q, sel) }
                </div>
              </div>

              <div className={`${styles.answerSection} ${styles.correctAnswer}`}>
                <div className={styles.answerTitle}>
                  ✅ Correct Answer:
                </div>
                <div style={{ marginTop: '8px' }}>
                  { q.format === 2 ? (
                    // for format 2 show blank_answer
                    <div dangerouslySetInnerHTML={{ __html: q.blank_answer || '' }} />
                  ) : q.format === 5 ? (
                    correctTableForFormat5
                  ) : q.format === 8 ? (
                    <ol className={styles.orderedList}>
                      { getCorrectOrderChoices(q).map(c => (
                        <li key={c.id}>
                          <strong>{c.label}</strong>. <span dangerouslySetInnerHTML={{__html:c.text}} />
                        </li>
                      )) }
                    </ol>
                  ) : q.format === 9 ? (
                    <div>
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontWeight:400, marginBottom:6 }}>➡️ Correct Actions</div>
                        { correctActions.length === 0 ? <div className={styles.noAnswer}>No correct actions defined</div> : (
                          <div style={{ display:'grid', gap:8 }}>
                            {correctActions.map(a => (
                              <div key={a.id} style={{ padding:8, background:'#fff', borderRadius:6, border:'1px solid #e2e8f0' }}>
                                <strong>{a.label}</strong>. <span dangerouslySetInnerHTML={{__html:a.text}} />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontWeight:400, marginBottom:6 }}>➡️ Correct Potentials</div>
                        { correctPotentials.length === 0 ? <div className={styles.noAnswer}>No correct potentials defined</div> : (
                          <div style={{ display:'grid', gap:8 }}>
                            {correctPotentials.map(p => (
                              <div key={p.id} style={{ padding:8, background:'#fff', borderRadius:6, border:'1px solid #e2e8f0' }}>
                                <strong>{p.label}</strong>. <span dangerouslySetInnerHTML={{__html:p.text}} />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <div style={{ fontWeight:400, marginBottom:6 }}>➡️ Correct Parameters</div>
                        { correctParameters.length === 0 ? <div className={styles.noAnswer}>No correct parameters defined</div> : (
                          <div style={{ display:'grid', gap:8 }}>
                            {correctParameters.map(p => (
                              <div key={p.id} style={{ padding:8, background:'#fff', borderRadius:6, border:'1px solid #e2e8f0' }}>
                                <strong>{p.label}</strong>. <span dangerouslySetInnerHTML={{__html:p.text}} />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    (q.choices && q.choices.length) ? (
                      <div>
                        {q.choices.filter(c => c.is_correct).map(c => (
                          <div key={c.id} style={{ marginBottom: '8px', padding: '8px', background: '#fff', borderRadius: '6px' }}>
                            <strong>✅ {c.label}</strong>. <span dangerouslySetInnerHTML={{__html:c.text}} />
                          </div>
                        ))}
                      </div>
                    ) : <div className={styles.noAnswer}>No correct choices defined</div>
                  ) }
                </div>
              </div>

              <div className={styles.explanationSection}>
                <div className={styles.explanationTitle}>
                  💡 Explanation:
                </div>
                <div 
                  className={styles.explanationText}
                  dangerouslySetInnerHTML={{ __html: q.explanation || 'No explanation provided.' }} 
                />
              </div>
            </div>
          );
        }) }
      </div>
    </div>
  );
}
