import React, { useEffect, useMemo, useState } from 'react';
import styles from './Format9.module.css';

/**
 * Props:
 * - question: object (with .cases, .actions, .potentials, .parameters)
 * - mode: 'exammode' | 'tutormode' | other
 * - onAnswer(payload)
 * - initialValue (previously saved state)
 *
 * Payload emitted: { bowtie: { actions: [id|null,id|null], potential: id|null, parameters: [id|null,id|null] } }
 */

export default function Format9({ question, mode, onAnswer, initialValue }) {
  const [placedActions, setPlacedActions] = useState([null, null]);
  const [placedPotential, setPlacedPotential] = useState(null);
  const [placedParameters, setPlacedParameters] = useState([null, null]);

  const [activeCaseIndex, setActiveCaseIndex] = useState(0);
  const cases = question.cases || [];

  // normalize initial value on mount (or when question changes)
  useEffect(() => {
    if (initialValue && initialValue.bowtie) {
      const b = initialValue.bowtie;
      setPlacedActions([ (b.actions && b.actions[0]) || null, (b.actions && b.actions[1]) || null ]);
      setPlacedPotential(b.potential || null);
      setPlacedParameters([ (b.parameters && b.parameters[0]) || null, (b.parameters && b.parameters[1]) || null ]);
    } else {
      setPlacedActions([null, null]);
      setPlacedPotential(null);
      setPlacedParameters([null, null]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id]);

  // emit changes to parent whenever slots change
  useEffect(() => {
    onAnswer && onAnswer({
      bowtie: {
        actions: placedActions.map(v => v === null ? null : Number(v)),
        potential: placedPotential === null ? null : Number(placedPotential),
        parameters: placedParameters.map(v => v === null ? null : Number(v)),
      }
    });
  }, [placedActions, placedPotential, placedParameters, onAnswer]);

  // convenience maps
  const actionsMap = useMemo(() => (question.actions || []).reduce((acc, a) => { acc[String(a.id)] = a; return acc; }, {}), [question.actions]);
  const potentialsMap = useMemo(() => (question.potentials || []).reduce((acc, p) => { acc[String(p.id)] = p; return acc; }, [question.potentials]));
  const parametersMap = useMemo(() => (question.parameters || []).reduce((acc, p) => { acc[String(p.id)] = p; return acc; }, {}), [question.parameters]);

  // Drag handlers: items carry JSON { type:'action'|'potential'|'parameter', id }
  function onDragStart(e, type, id) {
    try {
      e.dataTransfer.setData('application/json', JSON.stringify({ type, id }));
      e.dataTransfer.effectAllowed = 'move';
    } catch (err) { /* ignore */ }
  }

  function allowDrop(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  function handleDropOnActionSlot(e, slotIndex) {
    e.preventDefault();
    const raw = e.dataTransfer.getData('application/json');
    if (!raw) return;
    try {
      const { type, id } = JSON.parse(raw);
      if (type !== 'action') return;
      setPlacedActions(prev => {
        const copy = [...prev];
        // remove same id from other slot if present
        if (copy[0] === id) copy[0] = null;
        if (copy[1] === id) copy[1] = null;
        copy[slotIndex] = id;
        return copy;
      });
    } catch (err) { /* ignore */ }
  }

  function handleDropOnPotential(e) {
    e.preventDefault();
    const raw = e.dataTransfer.getData('application/json');
    if (!raw) return;
    try {
      const { type, id } = JSON.parse(raw);
      if (type !== 'potential') return;
      setPlacedPotential(id);
    } catch (err) { /* ignore */ }
  }

  function handleDropOnParameterSlot(e, slotIndex) {
    e.preventDefault();
    const raw = e.dataTransfer.getData('application/json');
    if (!raw) return;
    try {
      const { type, id } = JSON.parse(raw);
      if (type !== 'parameter') return;
      setPlacedParameters(prev => {
        const copy = [...prev];
        if (copy[0] === id) copy[0] = null;
        if (copy[1] === id) copy[1] = null;
        copy[slotIndex] = id;
        return copy;
      });
    } catch (err) { /* ignore */ }
  }

  function clearActionSlot(i) { setPlacedActions(prev => { const c=[...prev]; c[i]=null; return c; }); }
  function clearParameterSlot(i) { setPlacedParameters(prev => { const c=[...prev]; c[i]=null; return c; }); }
  function clearPotential() { setPlacedPotential(null); }

  // reveal logic and helper correctness checks
  const [revealed, setRevealed] = useState(false);

  // auto-reveal in tutormode when all slots filled
  useEffect(() => {
    const allFilled =
      Array.isArray(placedActions) && placedActions.every(v => v !== null) &&
      placedPotential !== null &&
      Array.isArray(placedParameters) && placedParameters.every(v => v !== null);

    if (mode === 'tutormode' && allFilled) {
      setRevealed(true);
    }
    // do not auto-hide if user already revealed manually
  }, [placedActions, placedPotential, placedParameters, mode]);

  function isActionCorrect(id) {
    const a = actionsMap[String(id)];
    return !!(a && a.is_correct);
  }
  function isPotentialCorrect(id) {
    const p = potentialsMap[String(id)];
    return !!(p && p.is_correct);
  }
  function isParameterCorrect(id) {
    const p = parametersMap[String(id)];
    return !!(p && p.is_correct);
  }

  const actionsList = question.actions || [];
  const potentialsList = question.potentials || [];
  const parametersList = question.parameters || [];

  const showRevealButton = mode !== 'exammode';

  return (
    <div className={styles.container}>
      <div className={styles.leftColumn}>
        {/* paragraph display added so Format 9 shows the paragraph just like Format 5 */}
        <div
          className={styles.paragraph}
          dangerouslySetInnerHTML={{ __html: question.paragraph || '' }}
        />

        <div className={styles.caseNav}>
          {cases.map((c, idx) => (
            <button
              key={idx}
              type="button"
              className={`${styles.caseButton} ${activeCaseIndex === idx ? styles.active : ''}`}
              onClick={() => setActiveCaseIndex(idx)}
            >
              <span dangerouslySetInnerHTML={{ __html: c.heading || `Case ${idx+1}` }} />
            </button>
          ))}
        </div>

        <div className={styles.caseContent}>
          {cases[activeCaseIndex] ? (
            <div dangerouslySetInnerHTML={{ __html: cases[activeCaseIndex].case_text }} />
          ) : (
            <div className={styles.noCase}>📝 No case text available</div>
          )}
        </div>
      </div>

      <div className={styles.rightColumn}>
        <div className={styles.questionText} dangerouslySetInnerHTML={{ __html: question.question_text || '' }} />

        <div className={styles.bowTie}>
          <div className={styles.leftWing}>
            <div
              className={`${styles.slot} ${styles.actionSlot}`}
              onDragOver={allowDrop}
              onDrop={(e) => handleDropOnActionSlot(e, 0)}
            >
              <div className={styles.slotLabel}>Action to Take</div>
              {placedActions[0] ? (
                <div
                  className={`${styles.placedItem} ${(isActionCorrect(placedActions[0]) && revealed) ? styles.correct : ''}`}
                  draggable={mode !== 'exammode'}
                  onDragStart={(e) => onDragStart(e, 'action', placedActions[0])}
                >
                  <div dangerouslySetInnerHTML={{ __html: actionsMap[String(placedActions[0])]?.text || '' }} />
                  {mode !== 'exammode' && <button className={styles.clearBtn} onClick={() => clearActionSlot(0)}>✕</button>}
                </div>
              ) : (
                <div className={styles.placeholder}>Drop action here</div>
              )}
            </div>

            <div
              className={`${styles.slot} ${styles.actionSlot}`}
              onDragOver={allowDrop}
              onDrop={(e) => handleDropOnActionSlot(e, 1)}
            >
              <div className={styles.slotLabel}>Action to Take</div>
              {placedActions[1] ? (
                <div
                  className={`${styles.placedItem} ${(isActionCorrect(placedActions[1]) && revealed) ? styles.correct : ''}`}
                  draggable={mode !== 'exammode'}
                  onDragStart={(e) => onDragStart(e, 'action', placedActions[1])}
                >
                  <div dangerouslySetInnerHTML={{ __html: actionsMap[String(placedActions[1])]?.text || '' }} />
                  {mode !== 'exammode' && <button className={styles.clearBtn} onClick={() => clearActionSlot(1)}>✕</button>}
                </div>
              ) : (
                <div className={styles.placeholder}>Drop action here</div>
              )}
            </div>
          </div>

          <div
            className={styles.centerKnot}
            onDragOver={allowDrop}
            onDrop={handleDropOnPotential}
          >
            <div className={styles.centerLabel}>Potential Condition</div>
            {placedPotential ? (
              <div className={`${styles.placedItemCenter} ${(isPotentialCorrect(placedPotential) && revealed) ? styles.correctCenter : ''}`}
                   draggable={mode !== 'exammode'}
                   onDragStart={(e) => onDragStart(e, 'potential', placedPotential)}
              >
                <div dangerouslySetInnerHTML={{ __html: potentialsMap[String(placedPotential)]?.text || '' }} />
                {mode !== 'exammode' && <button className={styles.clearBtn} onClick={clearPotential}>✕</button>}
              </div>
            ) : (
              <div className={styles.placeholderCenter}>Drop potential here</div>
            )}
          </div>

          <div className={styles.rightWing}>
            <div
              className={`${styles.slot} ${styles.paramSlot}`}
              onDragOver={allowDrop}
              onDrop={(e) => handleDropOnParameterSlot(e, 0)}
            >
              <div className={styles.slotLabel}>Parameter to Monitor</div>
              {placedParameters[0] ? (
                <div
                  className={`${styles.placedItem} ${(isParameterCorrect(placedParameters[0]) && revealed) ? styles.correct : ''}`}
                  draggable={mode !== 'exammode'}
                  onDragStart={(e) => onDragStart(e, 'parameter', placedParameters[0])}
                >
                  <div dangerouslySetInnerHTML={{ __html: parametersMap[String(placedParameters[0])]?.text || '' }} />
                  {mode !== 'exammode' && <button className={styles.clearBtn} onClick={() => clearParameterSlot(0)}>✕</button>}
                </div>
              ) : (
                <div className={styles.placeholder}>Drop parameter here</div>
              )}
            </div>

            <div
              className={`${styles.slot} ${styles.paramSlot}`}
              onDragOver={allowDrop}
              onDrop={(e) => handleDropOnParameterSlot(e, 1)}
            >
              <div className={styles.slotLabel}>Parameter to Monitor</div>
              {placedParameters[1] ? (
                <div
                  className={`${styles.placedItem} ${(isParameterCorrect(placedParameters[1]) && revealed) ? styles.correct : ''}`}
                  draggable={mode !== 'exammode'}
                  onDragStart={(e) => onDragStart(e, 'parameter', placedParameters[1])}
                >
                  <div dangerouslySetInnerHTML={{ __html: parametersMap[String(placedParameters[1])]?.text || '' }} />
                  {mode !== 'exammode' && <button className={styles.clearBtn} onClick={() => clearParameterSlot(1)}>✕</button>}
                </div>
              ) : (
                <div className={styles.placeholder}>Drop parameter here</div>
              )}
            </div>
          </div>
        </div>

        {showRevealButton && !revealed && (
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <button type="button" className={styles.revealBtn} onClick={() => setRevealed(true)}>
              🔍 Show Answer
            </button>
          </div>
        )}

        <div className={styles.tablesRow}>
          <div className={styles.tableWrap}>
            <div className={styles.tableTitle}>All Actions to Take</div>
            <div className={styles.table}>
              {(actionsList.length === 0) && <div className={styles.empty}>No actions defined</div>}
              {actionsList.map(a => (
                <div
                  key={a.id}
                  className={`${styles.tableRow} ${(a.is_correct && revealed) ? styles.highlightCorrect : ''}`}
                  draggable={mode !== 'exammode'}
                  onDragStart={(e) => onDragStart(e, 'action', a.id)}
                  title={a.is_correct && revealed ? 'Marked correct' : ''}
                >
                  <div className={styles.tableText} dangerouslySetInnerHTML={{ __html: a.text }} />
                  {/* only show the green tag when revealed */}
                  {a.is_correct && revealed && <div className={styles.tag}>✔</div>}
                </div>
              ))}
            </div>
          </div>

          <div className={styles.tableWrap}>
            <div className={styles.tableTitle}>Potential Conditions</div>
            <div className={styles.table}>
              {(potentialsList.length === 0) && <div className={styles.empty}>No potentials defined</div>}
              {potentialsList.map(p => (
                <div
                  key={p.id}
                  className={`${styles.tableRow} ${(p.is_correct && revealed) ? styles.highlightCorrect : ''}`}
                  draggable={mode !== 'exammode'}
                  onDragStart={(e) => onDragStart(e, 'potential', p.id)}
                  title={p.is_correct && revealed ? 'Marked correct' : ''}
                >
                  <div className={styles.tableText} dangerouslySetInnerHTML={{ __html: p.text }} />
                  {p.is_correct && revealed && <div className={styles.tag}>✔</div>}
                </div>
              ))}
            </div>
          </div>

          <div className={styles.tableWrap}>
            <div className={styles.tableTitle}>Parameters to Monitor</div>
            <div className={styles.table}>
              {(parametersList.length === 0) && <div className={styles.empty}>No parameters defined</div>}
              {parametersList.map(p => (
                <div
                  key={p.id}
                  className={`${styles.tableRow} ${(p.is_correct && revealed) ? styles.highlightCorrect : ''}`}
                  draggable={mode !== 'exammode'}
                  onDragStart={(e) => onDragStart(e, 'parameter', p.id)}
                  title={p.is_correct && revealed ? 'Marked correct' : ''}
                >
                  <div className={styles.tableText} dangerouslySetInnerHTML={{ __html: p.text }} />
                  {p.is_correct && revealed && <div className={styles.tag}>✔</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
