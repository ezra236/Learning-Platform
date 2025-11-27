import React, { useEffect, useState } from 'react';
import EditExamForm from './EditExamForm';
import EditQuestion from './EditQuestion';
import styles from './EditExamManager.module.css';
import { fetchCsrf } from '@/lib/nclexHelpers';
import Success from './Success';

export default function EditExamManager() {
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => { loadExams(); }, []);

  async function loadExams() {
    const resp = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/prep/exams/`);
    const data = await resp.json();
    setExams(data);
    if (data.length && !selectedExam) setSelectedExam(data[0]);
  }

  async function loadQuestionsForExam(examId) {
    const resp = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/prep/questions/?exam_id=${examId}`);
    const data = await resp.json();
    setQuestions(data);
    setSelectedQuestionId(data.length ? data[0].id : null);
  }

  useEffect(() => {
    if (selectedExam) loadQuestionsForExam(selectedExam.id);
    else setQuestions([]);
    setSelectedQuestionId(null);
  }, [selectedExam]);

  async function handleExamUpdated(newExam) {
    setExams(prev => prev.map(e => (e.id === newExam.id ? newExam : e)));
    setSelectedExam(newExam);
    setMessage('✓ Exam updated successfully');
    setTimeout(() => setMessage(''), 3000);
  }

  function onQuestionSaved() {
    setMessage('✓ Question saved successfully');
    setTimeout(() => setMessage(''), 3000);
    if (selectedExam) loadQuestionsForExam(selectedExam.id);
  }

  return (
    <div className={styles.container}>
      <Success message={message} />
      
      <header className={styles.header}>
        <h1 className={styles.title}>📝 Edit NCLEX Exams & Questions</h1>
        <p className={styles.subtitle}>Manage your exam content and questions</p>
      </header>

      <section className={styles.section}>
        <div className={styles.controlGroup}>
          <label className={styles.label}>
            <span className={styles.labelIcon}>📋</span>
            Select exam to edit
          </label>
          <div className={styles.selectWrapper}>
            <select 
              value={selectedExam?.id || ''} 
              onChange={(e) => setSelectedExam(exams.find(x => x.id === Number(e.target.value)))} 
              className={styles.select}
            >
              <option value="">-- Select exam --</option>
              {exams.map(ex => (
                <option key={ex.id} value={ex.id}>
                  {ex.name} {ex.is_completed ? '✅' : '📝'}
                </option>
              ))}
            </select>
            <span className={styles.selectArrow}>▼</span>
          </div>
        </div>
      </section>

      {selectedExam && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>⚙️</span>
            Exam Details
          </h2>
          <EditExamForm exam={selectedExam} onUpdated={handleExamUpdated} />
        </section>
      )}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>❓</span>
          Questions
        </h2>
        <div className={styles.questionsLayout}>
          <div className={styles.questionsSidebar}>
            <div className={styles.controlGroup}>
              <label className={styles.label}>
                <span className={styles.labelIcon}>🔍</span>
                Select question
              </label>
              <div className={styles.selectWrapper}>
                <select 
                  value={selectedQuestionId || ''} 
                  onChange={(e) => setSelectedQuestionId(Number(e.target.value))}
                  className={styles.select}
                >
                  <option value="">-- Select question --</option>
                  {questions.map(q => (
                    <option key={q.id} value={q.id}>
                      #{q.order || q.id} — Format {q.format}
                    </option>
                  ))}
                </select>
                <span className={styles.selectArrow}>▼</span>
              </div>
            </div>
            {selectedQuestionId && (
              <button 
                className={styles.editButton}
                onClick={() => setSelectedQuestionId(selectedQuestionId)}
              >
                ✏️ Edit Selected
              </button>
            )}
          </div>

          <div className={styles.questionEditor}>
            {selectedQuestionId ? (
              <EditQuestion
                questionId={selectedQuestionId}
                onSaved={onQuestionSaved}
                examIsCompleted={selectedExam?.is_completed}
              />
            ) : (
              <div className={styles.placeholder}>
                <div className={styles.placeholderIcon}>📚</div>
                <p>Select a question to start editing</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}