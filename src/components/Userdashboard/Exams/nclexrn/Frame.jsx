"use client";

import React, { useEffect, useRef, useState } from 'react';
import authFetch, { fetchCsrf } from './api';
import Format1 from './formats/Format1';
import Format2 from './formats/Format2';
import Format3 from './formats/Format3';
import Format4 from './formats/Format4';
import Format5 from './formats/Format5';
import Format6 from './formats/Format6';
import Format7 from './formats/Format7';
import Format8 from './formats/Format8';
import Format9 from './formats/Format9';      
import ExamReview from './ExamReview';
import Notify from './Notify';
import ReportModal from './ReportModal';
import SuccessToast from './SuccessToast';
import styles from './Frame.module.css';


const formats = {
  1: Format1, 2: Format2, 3: Format3, 4: Format4,
  5: Format5, 6: Format6, 7: Format7, 8: Format8,
  9: Format9,    // <-- added
};

export default function Frame({ mode, examname }) {
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [attempt, setAttempt] = useState(null);
  const attemptRef = useRef(null);
  const createAttemptPromiseRef = useRef(null);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [showReview, setShowReview] = useState(false);
  const selectedChoicesRef = useRef({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Autosave control refs
  const saveTimerRef = useRef(null);
  const saveInProgressRef = useRef(false);
  const pendingFlushRef = useRef(false);
  const lastSavedSnapshotRef = useRef(null); // JSON snapshot of last successfully saved selections

  // keep attemptRef synced w/ attempt state
  useEffect(()=>{ attemptRef.current = attempt; }, [attempt]);

  useEffect(() => {
    async function init() {
      try {
        await fetchCsrf();
        const resp = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/nclex/exams/by-name/?name=${encodeURIComponent(examname)}`, { credentials: 'include' });
        if (!resp.ok) throw new Error('Failed to load exam');
        const examJson = await resp.json();
        setExam(examJson);

        // check existing attempt
        const checkResp = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/nclex/attempts/check/${examJson.id}/`, { credentials: 'include' });
        if (checkResp.ok) {
          const checkJson = await checkResp.json();
          if (checkJson.exists) {
            // normalize attempt: selected_choices and last_question_order numeric
            const normalizedSelected = normalizeStoredSelections(checkJson.attempt.selected_choices || {});
            const normalizedAttempt = {
              ...checkJson.attempt,
              selected_choices: normalizedSelected,
              last_question_order: Number(checkJson.attempt.last_question_order) || 0
            };
            setAttempt(normalizedAttempt);
            attemptRef.current = normalizedAttempt;
            selectedChoicesRef.current = normalizedSelected;
            // set lastSavedSnapshot to server snapshot so we don't immediately re-save identical data
            lastSavedSnapshotRef.current = JSON.stringify(normalizedSelected);
            setNotifyOpen(true);
          }
        }
      } catch (e) {
        console.error(e);
        setSuccessMsg({ type:'error', text: e.message });
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [examname]);

  function normalizeStoredSelections(obj) {
    if (!obj) return {};
    const out = {};
    Object.entries(obj).forEach(([k,v]) => {
      if (v && typeof v === 'object') {
        if (v.selected_choices) {
          out[k] = { selected_choices: v.selected_choices.map(x => typeof x === 'string' ? Number(x) : x) };
        } else if (v.blanks) {
          const b = {};
          Object.entries(v.blanks).forEach(([bk,bv]) => b[bk] = (typeof bv === 'string' && /^\d+$/.test(bv)) ? Number(bv) : bv);
          out[k] = { blanks: b };
        } else if (v.rows) {
          out[k] = { rows: v.rows };
        } else if (v.ordered) {
          out[k] = { ordered: v.ordered.map(x => typeof x === 'string' ? Number(x) : x) };
        } else {
          out[k] = v;
        }
      } else {
        out[k] = v;
      }
    });
    return out;
  }

  async function startExam() {
    if (!exam) throw new Error('No exam loaded');
    if (createAttemptPromiseRef.current) return createAttemptPromiseRef.current;
    const p = (async () => {
      const payload = { exam: exam.id, selected_choices: {}, last_question_order: 0 };
      const res = await authFetch(`/nclex/attempts/`, { method: 'POST', body: payload });
      // normalize result
      const normalized = { ...res, selected_choices: normalizeStoredSelections(res.selected_choices || {}), last_question_order: Number(res.last_question_order) || 0 };
      setAttempt(normalized);
      attemptRef.current = normalized;
      selectedChoicesRef.current = normalized.selected_choices || {};
      // set lastSavedSnapshot to the empty/new state so we don't re-save same
      lastSavedSnapshotRef.current = JSON.stringify(selectedChoicesRef.current);
      createAttemptPromiseRef.current = null;
      return normalized;
    })();
    createAttemptPromiseRef.current = p;
    return p;
  }

  async function onStartFresh() {
    // flush pending saves before deleting
    await flushPendingSave();
    if (!attemptRef.current) { setNotifyOpen(false); return; }
    try {
      await authFetch(`/nclex/attempts/${attemptRef.current.id}/`, { method: 'DELETE' });
    } catch(e) { console.warn(e); }
    setAttempt(null);
    attemptRef.current = null;
    selectedChoicesRef.current = {};
    lastSavedSnapshotRef.current = null;
    setNotifyOpen(false);
    setCurrentIndex(0);
  }

  function onContinueAttempt() {
    // flush pending saves first
    flushPendingSave().catch(e => console.warn('flush before continue failed', e));
    if (!attemptRef.current) { setNotifyOpen(false); return; }
    selectedChoicesRef.current = attemptRef.current.selected_choices || {};
    // clamp last_question_order
    const raw = attemptRef.current.last_question_order;
    const idx = Number(raw) || 0;
    const clamped = Math.max(0, Math.min((exam?.questions?.length || 1) - 1, idx));
    setCurrentIndex(clamped);
    setNotifyOpen(false);
  }

  async function saveCurrentQuestionIfNeeded(questionId) {
    const payload = selectedChoicesRef.current[String(questionId)];
    if (!payload) return;
    // ensure attempt exists then flush changes
    if (!attemptRef.current) {
      await startExam();
    }
    await flushPendingSave();
  }

  async function ensureAttemptAndPatch(payload, questionId) {
    if (!attemptRef.current) {
      try { await startExam(); } catch(e) { throw e; }
    }
    const at = attemptRef.current;
    try {
      await authFetch(`/nclex/attempts/${at.id}/`, { method: 'PATCH', body: { selected_choices: selectedChoicesRef.current, last_question_order: currentIndex }});
      const updated = { ...attemptRef.current, selected_choices: selectedChoicesRef.current, last_question_order: currentIndex };
      setAttempt(updated);
      attemptRef.current = updated;
      // update lastSavedSnapshot after successful save
      lastSavedSnapshotRef.current = JSON.stringify(selectedChoicesRef.current);
    } catch (err) {
      console.warn('patch failed', err);
      if (err && err.message && err.message.includes('404')) {
        try {
          const check = await authFetch(`/nclex/attempts/check/${exam.id}/`);
          if (check.exists) {
            const normalized = { ...check.attempt, selected_choices: normalizeStoredSelections(check.attempt.selected_choices || {}), last_question_order: Number(check.attempt.last_question_order) || 0 };
            setAttempt(normalized); attemptRef.current = normalized;
            selectedChoicesRef.current = normalized.selected_choices || {};
            await authFetch(`/nclex/attempts/${normalized.id}/`, { method: 'PATCH', body: { selected_choices: selectedChoicesRef.current, last_question_order: currentIndex }});
            lastSavedSnapshotRef.current = JSON.stringify(selectedChoicesRef.current);
          }
        } catch (e2) { console.error('retry patch failed', e2); }
      } else {
        throw err;
      }
    }
  }

  function normalizeOutgoingPayload(payload) {
    if (!payload) return payload;
    if (payload.selected_choices) {
      return { selected_choices: payload.selected_choices.map(x => typeof x === 'string' ? Number(x) : x) };
    }
    if (payload.blanks) {
      const b = {};
      Object.entries(payload.blanks).forEach(([k,v]) => {
        b[k] = (typeof v === 'string' && /^\d+$/.test(v)) ? Number(v) : v;
      });
      return { blanks: b };
    }
    if (payload.rows) {
      const r = {};
      Object.entries(payload.rows).forEach(([k,v]) => {
        r[String(k)] = v;
      });
      return { rows: r };
    }
    if (payload.ordered) {
      return { ordered: payload.ordered.map(x => typeof x === 'string' ? Number(x) : x) };
    }
    return payload;
  }

  // Debounced flush that coalesces rapid updates.
  async function flushPendingSave() {
    // If there's a scheduled debounce timer, clear it (we will flush immediately).
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    // Wait if a save is already in progress
    if (saveInProgressRef.current) {
      pendingFlushRef.current = true;
      while (saveInProgressRef.current) {
        // small wait
        // eslint-disable-next-line no-await-in-loop
        await new Promise(r => setTimeout(r, 40));
      }
    }

    // If nothing to save, return
    if (!attemptRef.current && Object.keys(selectedChoicesRef.current || {}).length === 0) return;
    const snapshot = JSON.stringify(selectedChoicesRef.current || {});
    if (snapshot === lastSavedSnapshotRef.current) {
      // nothing changed since last successful save
      pendingFlushRef.current = false;
      return;
    }

    try {
      saveInProgressRef.current = true;
      // ensure attempt exists
      if (!attemptRef.current) await startExam();
      await authFetch(`/nclex/attempts/${attemptRef.current.id}/`, { method: 'PATCH', body: { selected_choices: selectedChoicesRef.current, last_question_order: currentIndex }});
      const updated = { ...attemptRef.current, selected_choices: selectedChoicesRef.current, last_question_order: currentIndex };
      setAttempt(updated);
      attemptRef.current = updated;
      lastSavedSnapshotRef.current = snapshot;
      pendingFlushRef.current = false;
    } catch (err) {
      console.error('flushPendingSave failed', err);
    } finally {
      saveInProgressRef.current = false;
    }
  }

  // Called by formats when user interacts
  async function updateSelectedChoice(questionId, payload) {
    const normalized = normalizeOutgoingPayload(payload);
    // update local store immediately
    selectedChoicesRef.current = {...selectedChoicesRef.current, [String(questionId)]: normalized};

    // create attempt immediately on first user interaction (so attempts are recorded)
    if (!attemptRef.current) {
      try {
        await startExam();
      } catch (e) {
        console.error('startExam error', e);
        setSuccessMsg({ type:'error', text: e.message || 'Could not start attempt' });
      }
    }

    // dedupe: if snapshot equals last saved snapshot, don't schedule save
    const currentSnapshot = JSON.stringify(selectedChoicesRef.current || {});
    if (currentSnapshot === lastSavedSnapshotRef.current) {
      // nothing new to save
      return;
    }

    // schedule debounce save (coalesce bursts)
    pendingFlushRef.current = true;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    // debounce interval (tunable) - 600ms is a reasonable balance
    saveTimerRef.current = setTimeout(() => {
      flushPendingSave().catch(e => console.error('debounced flush error', e));
    }, 600);
  }

  async function submitExam() {
    try {
      const curQ = exam.questions[currentIndex];
      await saveCurrentQuestionIfNeeded(curQ.id);
      // flush pending changes before submit
      await flushPendingSave();
      if (!attemptRef.current) await startExam();
      setIsSubmitting(true);
      const payload = { selected_choices: selectedChoicesRef.current, time_taken_seconds: 0 };
      const res = await authFetch(`/nclex/attempts/${attemptRef.current.id}/submit/`, { method: 'POST', body: payload });
      // server returns attempt & grade
      const normalizedAttempt = res.attempt ? { ...res.attempt, selected_choices: normalizeStoredSelections(res.attempt.selected_choices || {}), last_question_order: Number(res.attempt.last_question_order) || 0 } : attemptRef.current;
      setAttempt(normalizedAttempt);
      attemptRef.current = normalizedAttempt;
      // update lastSavedSnapshot to server snapshot after submit (if server returned)
      if (res.attempt && res.attempt.selected_choices) {
        lastSavedSnapshotRef.current = JSON.stringify(normalizeStoredSelections(res.attempt.selected_choices || {}));
      }
      setShowReview(true);
      setSuccessMsg({ type:'success', text:`Grade ${res.grade}` });
    } catch (e) {
      console.error(e);
      setSuccessMsg({ type:'error', text: e.message || 'Submit failed' });
    } finally { setIsSubmitting(false); }
  }

  if (loading) return (
    <div className={styles.container}>
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading exam...</p>
      </div>
    </div>
  );
  
  if (!exam) return (
    <div className={styles.container}>
      <div className={styles.error}>
        <span className={styles.errorIcon}>❌</span>
        <h2>Exam not found</h2>
        <p>The requested exam could not be loaded. Please try again.</p>
      </div>
    </div>
  );

  const curQ = exam.questions[currentIndex];
  const FormatComponent = formats[curQ.format] || (()=> <div>Unsupported format</div>);

  function getInitialValueFor(q) {
    const local = selectedChoicesRef.current[String(q.id)];
    if (local) return local;
    if (attemptRef.current && attemptRef.current.selected_choices) return attemptRef.current.selected_choices[String(q.id)];
    return undefined;
  }

  async function handleNext() {
    await saveCurrentQuestionIfNeeded(curQ.id);
    // flush immediately to persist before navigation
    await flushPendingSave();
    if (currentIndex < exam.questions.length - 1) setCurrentIndex(i => i + 1);
  }

  async function handlePrev() {
    await saveCurrentQuestionIfNeeded(curQ.id);
    await flushPendingSave();
    setCurrentIndex(i => Math.max(0, i - 1));
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{exam.name}</h1>
        <div className={styles.modeBadge}>Rushhourcamp 🎯</div>
      </div>

      <div className={styles.controls}>
        <div className={styles.leftControls}>
          <button 
            className={`${styles.button} ${styles.buttonSecondary}`}
            onClick={() => setReportOpen(true)}
          >
            📝 Report Question
          </button>
          <button 
            className={`${styles.button} ${styles.buttonPrimary}`}
            onClick={async () => {
              try {
                await flushPendingSave();
                await authFetch(`/nclex/bookmarks/`, { method: 'POST', body: { question: curQ.id, exam: exam.id }});
                setSuccessMsg({ type:'success', text: 'Bookmarked successfully' });
              } catch (e) {
                setSuccessMsg({ type:'error', text: ' Bookmark failed' });
              }
            }}
          >
            🔖 Bookmark
          </button>
        </div>

        <div className={styles.progress}>
          📊 Question {currentIndex + 1} of {exam.questions.length}
        </div>
      </div>

      <div className={styles.questionContainer}>
        <FormatComponent
          key={curQ.id}
          question={curQ}
          mode={mode}
          initialValue={getInitialValueFor(curQ)}
          onAnswer={(payload) => updateSelectedChoice(curQ.id, payload)}
        />
      </div>

      <div className={styles.navigation}>
        <button 
          onClick={handlePrev} 
          disabled={currentIndex === 0}
          className={`${styles.navButton} ${styles.navButtonPrev}`}
        >
          ◀️ Previous
        </button>

        {currentIndex < exam.questions.length - 1 ? (
          <button 
            onClick={handleNext}
            className={`${styles.navButton} ${styles.navButtonNext}`}
          >
            Next ▶️
          </button>
        ) : (
          <button 
            onClick={submitExam} 
            disabled={isSubmitting}
            className={`${styles.navButton} ${styles.navButtonSubmit}`}
          >
            {isSubmitting ? '⏳ Submitting...' : '🏁 Submit Exam'}
          </button>
        )}
      </div>

      {notifyOpen && <Notify onStartFresh={onStartFresh} onContinue={onContinueAttempt} />}
      {reportOpen && <ReportModal question={curQ} exam={exam} onClose={() => setReportOpen(false)} onSuccess={() => { setSuccessMsg({type:'success', text:'✅ Report submitted successfully'}); setReportOpen(false); }} />}
      {successMsg && <SuccessToast type={successMsg.type} text={successMsg.text} onClose={() => setSuccessMsg(null)} />}
      {showReview && <ExamReview attempt={attemptRef.current || attempt} exam={exam} onClose={() => setShowReview(false)} />}
    </div>
  );
}