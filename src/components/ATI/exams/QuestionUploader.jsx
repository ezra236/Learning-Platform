'use client';

import React, { useEffect, useState } from 'react';
import { Editor } from '@tinymce/tinymce-react';

// Success Notification Component
const SuccessNotification = ({ message, show, onClose }) => {
  return (
    <div style={{
      position: 'fixed',
      top: show ? 20 : -100,
      right: 20,
      background: 'linear-gradient(135deg, #48bb78, #38a169)',
      color: 'white',
      padding: '16px 20px',
      borderRadius: '12px',
      boxShadow: '0 10px 30px rgba(72, 187, 120, 0.4)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      transition: 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      transform: show ? 'translateX(0)' : 'translateX(100px)',
      opacity: show ? 1 : 0,
      maxWidth: '400px',
      border: '2px solid rgba(255,255,255,0.2)',
      backdropFilter: 'blur(10px)'
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.2)',
        padding: '8px',
        borderRadius: '8px',
        fontSize: '1.2rem'
      }}>
        ✅
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: '400', fontSize: '1rem', marginBottom: '2px' }}>
          Success!
        </div>
        <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
          {message}
        </div>
      </div>
      <button 
        onClick={onClose}
        style={{
          background: 'rgba(255,255,255,0.2)',
          border: 'none',
          color: 'white',
          borderRadius: '6px',
          width: '28px',
          height: '28px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.1rem',
          transition: 'all 0.2s ease'
        }}
      >
        ✕
      </button>
    </div>
  );
};

const formatConfig = {
  1: { question: true, paragraph: false, image: false, table: false, choices: true, specialChoices: false, specialOrder: false, explanation: true },
  2: { question: true, paragraph: false, image: true,  table: false, choices: true, specialChoices: false, specialOrder: false, explanation: true },
  3: { question: true, paragraph: true,  image: true,  table: false, choices: true, specialChoices: false, specialOrder: false, explanation: true },
  4: { question: true, paragraph: true,  image: false, table: false, choices: true, specialChoices: false, specialOrder: false, explanation: true },
  5: { question: true, paragraph: false, image: false, table: true,  choices: true, specialChoices: false, specialOrder: false, explanation: true },
  6: { question: false,paragraph: true,  image: false, table: true,  choices: true, specialChoices: false, specialOrder: false, explanation: true },
};

const formatDescriptions = {
  1: "❓ Question + ☑️ Choices + 💡 Explanation + ✅ Correct Answer",
  2: "❓ Question + 🖼️ Image + ☑️ Choices + 💡 Explanation + ✅ Correct Answer", 
  3: "📝 Paragraph + 🖼️ Image + ❓ Question + ☑️ Choices + 💡 Explanation + ✅ Correct Answer",
  4: "📝 Paragraph + ❓ Question + ☑️ Choices + 💡 Explanation + ✅ Correct Answer",
  5: "❓ Question + 📊 Table + ☑️ Choices + 💡 Explanation + ✅ Correct Answer",
  6: "📝 Paragraph + 📊 Table + ☑️ Choices + 💡 Explanation + ✅ Correct Answer",
};

export default function QuestionUploader() {
  const TINYMCE_KEY = process.env.NEXT_PUBLIC_TINYMCE_API_KEY || 'f2jlhbbkqssnh4l16bulq8v91zlo60ned1ynwn0bdu2mn1dm';
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

  // Success notification state
  const [notification, setNotification] = useState({ show: false, message: '' });

  // CSRF token state
  const [csrfToken, setCsrfToken] = useState(null);

  // exams state (fetched)
  const [exams, setExams] = useState([]);
  const [loadingExams, setLoadingExams] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // new exam quick-create
  const [newExamName, setNewExamName] = useState('');
  const [creatingExam, setCreatingExam] = useState(false);

  // question state (same as before)
  const [examId, setExamId] = useState('');
  const [format, setFormat] = useState(1);
  const [order, setOrder] = useState(1);

  // rich text fields
  const [questionHtml, setQuestionHtml] = useState('');
  const [paragraphHtml, setParagraphHtml] = useState('');
  const [tableHtml, setTableHtml] = useState('');
  const [explanationHtml, setExplanationHtml] = useState('');

  // image
  const [imageFile, setImageFile] = useState(null);

  // choices
  const [choices, setChoices] = useState([{ text_html: '', is_correct: false }]);

  // special choices
  const [specialChoices, setSpecialChoices] = useState([{ text_html: '' }]);
  const [specialCorrectOrder, setSpecialCorrectOrder] = useState([]);

  // UI state for marking exam completed
  const [markingExam, setMarkingExam] = useState(false);

  const cfg = formatConfig[Number(format)] || formatConfig[1];

  // Show notification function
  const showNotification = (message) => {
    setNotification({ show: true, message });
    setTimeout(() => {
      setNotification({ show: false, message: '' });
    }, 5000);
  };

  // Close notification manually
  const closeNotification = () => {
    setNotification({ show: false, message: '' });
  };

  // Shared TinyMCE init config
  const baseEditorInit = {
    menubar: false,
    plugins: [
  'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'table',
  'code', 'help'
],
    toolbar:
      'undo redo | formatselect | fontfamily fontsize | bold italic underline | forecolor backcolor | alignleft aligncenter alignright | bullist numlist | link image | table | removeformat | code | help',
    font_family_formats:
      'Inter=Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; ' +
      'Serif=Georgia, serif; ' +
      '"Times New Roman"=Times New Roman, Times, serif; ' +
      '"Courier New"=Courier New, Courier, monospace; ' +
      'Monospace=monospace;',
    font_size_formats: '8px 10px 12px 14px 16px 18px 20px 24px 30px 36px',
    block_formats: 'Paragraph=p; Heading 1=h1; Heading 2=h2; Heading 3=h3; Heading 4=h4; Preformatted=pre',
    color_map: [
      '000000', 'Black',
      '444444', 'Dark Gray',
      '7f8c8d', 'Gray',
      'ff0000', 'Red',
      'ff9900', 'Orange',
      'ffd400', 'Yellow',
      '00a65a', 'Green',
      '0073e6', 'Blue',
      '6f42c1', 'Purple',
      'ffffff', 'White'
    ],
    content_css: [
      'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap',
      'https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap'
    ],
    content_style:
      "body { font-family: Roboto, Inter, Helvetica, Arial, sans-serif; font-size:14px; color: #222; line-height:1.45; } " +
      "h1 { font-size: 28px; margin: 0 0 12px; font-weight: 700; color: #111; } " +
      "h2 { font-size: 22px; margin: 0 0 10px; font-weight: 700; color: #222; } " +
      "h3 { font-size: 18px; margin: 0 0 8px; font-weight: 600; color: #333; } " +
      "p { margin: 0 0 10px; } " +
      "img { max-width: 100%; height: auto; }",
  };

  // Fetch CSRF token from backend endpoint (ensures cookie is set)
  async function fetchCsrfToken() {
    try {
      const res = await fetch(`${apiBase}/api/auth/csrf/`, {
        method: 'GET',
        credentials: 'include' // ensure cookies are set/sent
      });
      if (!res.ok) {
        console.warn('Failed to fetch CSRF token endpoint:', res.status);
        return null;
      }
      const data = await res.json().catch(() => ({}));
      const token = data && data.csrfToken ? data.csrfToken : null;
      setCsrfToken(token);
      return token;
    } catch (err) {
      console.error('Network error while fetching CSRF token', err);
      return null;
    }
  }

  // Fetch exams from API
  async function fetchExams() {
    setLoadingExams(true);
    setFetchError(null);
    try {
      const res = await fetch(`${apiBase}/api/ati/`, { method: 'GET', credentials: 'include' });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      setExams(data);
      if (data && data.length > 0) setExamId(String(data[0].id));
    } catch (err) {
      setFetchError(err.message || 'Failed to fetch exams');
      setExams([]);
    } finally {
      setLoadingExams(false);
    }
  }

  useEffect(() => {
    // Initialize: get CSRF token (sets cookie) then fetch exams
    (async () => {
      await fetchCsrfToken();
      await fetchExams();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createExam(e) {
    e.preventDefault();
    if (!newExamName.trim()) {
      showNotification('Please enter an exam name');
      return;
    }
    setCreatingExam(true);
    try {
      // ensure we have a csrf token
      const token = csrfToken || await fetchCsrfToken();

      const res = await fetch(`${apiBase}/api/ati/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'X-CSRFToken': token } : {})
        },
        credentials: 'include',
        body: JSON.stringify({ name: newExamName.trim(), completed: false }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('Create exam error', err);
        showNotification('Failed to create exam - check console');
        return;
      }
      setNewExamName('');
      await fetchExams();
      showNotification('Exam created successfully!');
    } catch (err) {
      console.error(err);
      showNotification('Network error while creating exam');
    } finally {
      setCreatingExam(false);
    }
  }

  useEffect(() => {
    if (!cfg.choices) setChoices([{ text_html: '', is_correct: false }]);
    if (!cfg.specialChoices) { setSpecialChoices([{ text_html: '' }]); setSpecialCorrectOrder([]); }
    if (!cfg.image) setImageFile(null);
    if (!cfg.question) setQuestionHtml('');
    if (!cfg.paragraph) setParagraphHtml('');
    if (!cfg.table) setTableHtml('');
    if (!cfg.explanation) setExplanationHtml('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [format]);

  function addChoice() { setChoices(prev => [...prev, { text_html: '', is_correct: false }]); }
  function removeChoice(idx) { setChoices(prev => prev.filter((_, i) => i !== idx)); }
  function updateChoice(idx, field, value) {
    setChoices(prev => {
      const arr = [...prev]; arr[idx][field] = value; return arr;
    });
  }

  function addSpecialChoice() { setSpecialChoices(prev => [...prev, { text_html: '' }]); }
  function removeSpecialChoice(idx) {
    setSpecialChoices(prev => prev.filter((_, i) => i !== idx));
    setSpecialCorrectOrder(prev => prev.filter(i => i !== idx).map(i => (i > idx ? i - 1 : i)));
  }
  function updateSpecialChoice(idx, value) {
    setSpecialChoices(prev => { const arr = [...prev]; arr[idx].text_html = value; return arr; });
  }

  async function markExamCompleted() {
    if (!examId) {
      showNotification('Please select an exam first');
      return;
    }
    const selectedExam = exams.find(ex => String(ex.id) === String(examId));
    if (!selectedExam) {
      showNotification('Selected exam not found');
      return;
    }
    if (selectedExam.completed) {
      showNotification('This exam is already marked completed');
      return;
    }

    setMarkingExam(true);
    try {
      const token = csrfToken || await fetchCsrfToken();
      const res = await fetch(`${apiBase}/api/ati/${examId}/`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'X-CSRFToken': token } : {})
        },
        credentials: 'include',
        body: JSON.stringify({ completed: true }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        console.error('Mark completed error', j);
        showNotification('Failed to mark exam completed - check console');
        return;
      }
      const updated = await res.json();
      setExams(prev => prev.map(ex => String(ex.id) === String(updated.id) ? updated : ex));
      showNotification(`Exam "${updated.name}" marked as completed!`);
    } catch (err) {
      console.error(err);
      showNotification('Network error - see console');
    } finally {
      setMarkingExam(false);
    }
  }

  async function submit(e) {
    e.preventDefault();
    if (!examId) {
      showNotification('Please select an exam');
      return;
    }

    const choicesPayload = cfg.choices
      ? choices.map((c, i) => ({
          text_html: typeof c.text_html === 'string' ? c.text_html : '',
          is_correct: !!c.is_correct,
          order: Number(c.order ?? i),
        }))
      : undefined;

    const specialChoicesPayload = cfg.specialChoices
      ? specialChoices.map((sc, i) => ({
          text_html: typeof sc.text_html === 'string' ? sc.text_html : '',
          order: Number(sc.order ?? i),
        }))
      : undefined;

    const specialOrderPayload = cfg.specialOrder ? (Array.isArray(specialCorrectOrder) ? specialCorrectOrder.map(n => Number(n)) : []) : undefined;

    const fd = new FormData();
    fd.append('exam', String(Number(examId)));
    fd.append('format', String(format));
    fd.append('order', String(order));

    if (cfg.question) fd.append('question_html', questionHtml || '');
    if (cfg.paragraph) fd.append('paragraph_html', paragraphHtml || '');
    if (cfg.table) fd.append('table_html', tableHtml || '');
    if (cfg.explanation) fd.append('explanation_html', explanationHtml || '');

    if (cfg.choices) fd.append('choices', JSON.stringify(choicesPayload));
    if (cfg.specialChoices) fd.append('specialchoices', JSON.stringify(specialChoicesPayload));
    if (cfg.specialOrder) fd.append('special_correct_order', JSON.stringify(specialOrderPayload));
    if (cfg.image && imageFile) fd.append('image', imageFile);

    console.log('Submitting question payload:', {
      exam: examId,
      format,
      order,
      choicesPayload,
      specialChoicesPayload,
      specialOrderPayload,
    });

    for (const pair of fd.entries()) {
      console.log('FormData entry:', pair[0], pair[1]);
    }

    try {
      const token = csrfToken || await fetchCsrfToken();

      const res = await fetch(`${apiBase}/api/ati/questions/`, { 
        method: 'POST', 
        body: fd,
        credentials: 'include',
        headers: {
          ...(token ? { 'X-CSRFToken': token } : {})
          // Note: Do NOT set Content-Type when sending FormData; browser will set the boundary.
        }
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        console.error('Upload error', j);
        showNotification('Upload failed - check console');
        return;
      }
      const data = await res.json();
      showNotification(`Question created successfully! ID: ${data.id}`);
      
      // Reset form after successful submission
      setQuestionHtml('');
      setParagraphHtml('');
      setTableHtml('');
      setExplanationHtml('');
      setImageFile(null);
      setChoices([{ text_html: '', is_correct: false }]);
      setSpecialChoices([{ text_html: '' }]);
      setSpecialCorrectOrder([]);
      setOrder(prev => prev + 1);
      
    } catch (err) {
      console.error(err);
      showNotification('Network error - see console');
    }
  }

  const selectedExam = exams.find(ex => String(ex.id) === String(examId));

  return (
    <div style={{ 
      maxWidth: 1200, 
      margin: '0 auto', 
      padding: '20px',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      background: '#f8fafc',
      minHeight: '100vh',
      position: 'relative'
    }}>
      
      {/* Success Notification */}
      <SuccessNotification 
        message={notification.message} 
        show={notification.show} 
        onClose={closeNotification}
      />

      {/* Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '30px 25px',
        borderRadius: '16px',
        marginBottom: '30px',
        boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '200px',
          height: '200px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '50%'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '-80px',
          left: '-80px',
          width: '250px',
          height: '250px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '50%'
        }}></div>
        
        <h1 style={{ 
          margin: '0 0 12px 0', 
          fontSize: 'clamp(1.8rem, 5vw, 2.5rem)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          fontWeight: '400',
          position: 'relative',
          zIndex: 2
        }}>
          <span style={{ 
            background: 'rgba(255,255,255,0.2)', 
            padding: '12px',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)'
          }}>
            📚
          </span>
          Question Uploader
        </h1>
        <p style={{ 
          margin: 0, 
          opacity: 0.95,
          fontSize: 'clamp(1rem, 3vw, 1.2rem)',
          fontWeight: '400',
          position: 'relative',
          zIndex: 2
        }}>
          Create and manage ATI TEAS 7 exam questions with rich text editing
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '25px'
      }}>
        {/* Exams Section */}
        <section style={{ 
          background: 'white',
          padding: '28px',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{ 
            margin: '0 0 24px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#1a202c',
            fontSize: '1.4rem',
            fontWeight: '400'
          }}>
            <span style={{
              background: 'linear-gradient(135deg, #4299e1, #667eea)',
              padding: '10px',
              borderRadius: '10px',
              fontSize: '1.2rem'
            }}>
              📋
            </span>
            Exam Management
          </h3>

          {loadingExams ? (
            <div style={{ 
              padding: '30px', 
              textAlign: 'center',
              background: 'linear-gradient(135deg, #f7fafc, #edf2f7)',
              borderRadius: '12px',
              marginBottom: '24px',
              border: '2px dashed #cbd5e0'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '12px' }}>⏳</div>
              <div style={{ fontSize: '1.1rem', color: '#4a5568', fontWeight: '400' }}>Loading exams...</div>
            </div>
          ) : fetchError ? (
            <div style={{ 
              background: 'linear-gradient(135deg, #fed7d7, #feb2b2)',
              color: '#c53030',
              padding: '20px',
              borderRadius: '12px',
              marginBottom: '24px',
              border: '1px solid #fc8181',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{ fontSize: '1.5rem' }}>⚠️</span>
              <div>
                <strong>Error fetching exams:</strong> {fetchError}
              </div>
            </div>
          ) : exams.length === 0 ? (
            <div style={{ 
              background: 'linear-gradient(135deg, #f0fff4, #c6f6d5)',
              padding: '30px',
              borderRadius: '12px',
              textAlign: 'center',
              marginBottom: '24px',
              border: '2px dashed #48bb78'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📝</div>
              <div style={{ fontSize: '1.2rem', color: '#22543d', fontWeight: '400', marginBottom: '8px' }}>
                No Exams Found
              </div>
              <div style={{ color: '#2d774b', fontSize: '1rem' }}>
                Create your first exam to get started
              </div>
            </div>
          ) : null}

          <div style={{ 
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '20px',
            '@media (minWidth: 768px)': {
              gridTemplateColumns: '2fr 1fr'
            }
          }}>
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '10px',
                fontWeight: '400',
                color: '#2d3748',
                fontSize: '1rem'
              }}>
                🎯 Select Exam
              </label>
              <select 
                value={examId} 
                onChange={(e) => setExamId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  background: 'white',
                  color: '#000000',
                  transition: 'all 0.2s ease',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                <option value="" style={{ color: '#000000' }}>-- select exam --</option>
                {exams.map(ex => (
                  <option 
                    key={ex.id} 
                    value={String(ex.id)}
                    style={{ 
                      color: '#000000',
                      background: 'white',
                      fontWeight: ex.completed ? '600' : '400'
                    }}
                  >
                    {ex.name}{ex.completed ? ' ✅ (Completed)' : ' 📝 (Draft)'}
                  </option>
                ))}
              </select>
              
              {selectedExam && (
                <div style={{ 
                  marginTop: '14px',
                  padding: '14px',
                  borderRadius: '10px',
                  background: selectedExam.completed 
                    ? 'linear-gradient(135deg, #c6f6d5, #9ae6b4)' 
                    : 'linear-gradient(135deg, #fed7d7, #feb2b2)',
                  color: selectedExam.completed ? '#22543d' : '#744210',
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontWeight: '500',
                  border: `2px solid ${selectedExam.completed ? '#48bb78' : '#ed8936'}`
                }}>
                  <span style={{ fontSize: '1.2rem' }}>
                    {selectedExam.completed ? '✅' : '📝'}
                  </span>
                  <div>
                    <strong>{selectedExam.completed ? 'Completed Exam' : 'Draft Exam'}</strong>
                    <br />
                    {selectedExam.completed 
                      ? 'This exam is completed and locked for editing.' 
                      : 'This exam is a draft and accepts new questions.'
                    }
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                type="button"
                onClick={markExamCompleted}
                disabled={!examId || markingExam || (selectedExam && selectedExam.completed)}
                style={{
                  padding: '14px 20px',
                  background: !examId || (selectedExam && selectedExam.completed) 
                    ? 'linear-gradient(135deg, #a0aec0, #718096)' 
                    : 'linear-gradient(135deg, #48bb78, #38a169)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: !examId || (selectedExam && selectedExam.completed) ? 'not-allowed' : 'pointer',
                  fontWeight: '400',
                  fontSize: '1rem',
                  transition: 'all 0.2s ease',
                  opacity: !examId || (selectedExam && selectedExam.completed) ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  justifyContent: 'center',
                  boxShadow: !examId || (selectedExam && selectedExam.completed) ? 'none' : '0 4px 12px rgba(72, 187, 120, 0.3)'
                }}
              >
                {markingExam ? (
                  <>
                    <span>⏳</span>
                    Processing...
                  </>
                ) : (
                  <>
                    <span>✅</span>
                    Mark Completed
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Create Exam */}
          <form onSubmit={createExam} style={{ marginTop: '28px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '14px',
              fontWeight: '400',
              color: '#2d3748',
              fontSize: '1rem'
            }}>
              🆕 Quick Create Exam
            </label>
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '12px',
              '@media (minWidth: 480px)': { 
                gridTemplateColumns: '2fr 1fr' 
              }
            }}>
              <div style={{ position: 'relative' }}>
                <input 
                  value={newExamName} 
                  onChange={(e) => setNewExamName(e.target.value)} 
                  placeholder="Enter exam name"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    transition: 'all 0.2s ease',
                    background: 'white',
                    color: '#000000'
                  }}
                />
              </div>
              <button 
                type="submit" 
                disabled={creatingExam}
                style={{
                  padding: '14px 20px',
                  background: creatingExam 
                    ? 'linear-gradient(135deg, #a0aec0, #718096)' 
                    : 'linear-gradient(135deg, #4299e1, #3182ce)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: creatingExam ? 'not-allowed' : 'pointer',
                  fontWeight: '400',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  boxShadow: creatingExam ? 'none' : '0 4px 12px rgba(66, 153, 225, 0.3)'
                }}
              >
                {creatingExam ? (
                  <>
                    <span>⏳</span>
                    Creating...
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    Create Exam
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* Question Form */}
        <section style={{ 
          background: 'white',
          padding: '28px',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid #e2e8f0'
        }}>
          <form onSubmit={submit}>
            <h3 style={{ 
              margin: '0 0 28px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: '#1a202c',
              fontSize: '1.4rem',
              fontWeight: '400'
            }}>
              <span style={{
                background: 'linear-gradient(135deg, #ed64a6, #ed8936)',
                padding: '10px',
                borderRadius: '10px',
                fontSize: '1.2rem'
              }}>
                ✨
              </span>
              Create New Question
            </h3>

            <div style={{ display: 'grid', gap: '28px' }}>
              {/* Format Selection */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '14px',
                  fontWeight: '400',
                  color: '#2d3748',
                  fontSize: '1.1rem'
                }}>
                  📋 Question Format
                </label>
                <select 
                  value={format} 
                  onChange={(e) => setFormat(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    background: 'white',
                    color: '#000000',
                    marginBottom: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {Array.from({ length: 6 }, (_, i) => i + 1).map(n => (
                    <option 
                      key={n} 
                      value={n}
                      style={{ 
                        color: '#000000',
                        background: 'white',
                        padding: '12px'
                      }}
                    >
                      Format {n}: {formatDescriptions[n]}
                    </option>
                  ))}
                </select>
                <div style={{ 
                  padding: '16px',
                  background: 'linear-gradient(135deg, #f7fafc, #edf2f7)',
                  borderRadius: '10px',
                  fontSize: '0.95rem',
                  color: '#2d3748',
                  border: '2px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <span style={{ 
                    background: '#4299e1',
                    color: 'white',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    fontSize: '0.9rem'
                  }}>
                    📝
                  </span>
                  <div>
                    <strong>Selected Format:</strong> {formatDescriptions[format]}
                  </div>
                </div>
              </div>

              {/* Order Input */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '10px',
                  fontWeight: '400',
                  color: '#2d3748',
                  fontSize: '1.1rem'
                }}>
                  🔢 Question Order
                </label>
                <input 
                  type="number" 
                  value={order} 
                  min={1} 
                  onChange={(e) => setOrder(Number(e.target.value))}
                  style={{
                    width: '100%',
                    maxWidth: '200px',
                    padding: '14px 16px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    background: 'white',
                    color: '#000000',
                    transition: 'all 0.2s ease'
                  }}
                />
              </div>

              {/* Dynamic Fields */}
              {cfg.paragraph && (
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '14px',
                    fontWeight: '400',
                    color: '#2d3748',
                    fontSize: '1.1rem'
                  }}>
                    📝 Paragraph Content
                  </label>
                  <div style={{ 
                    border: '2px solid #e2e8f0', 
                    borderRadius: '10px', 
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                  }}>
                    <Editor apiKey={TINYMCE_KEY} value={paragraphHtml} init={{ ...baseEditorInit, height: 350 }} onEditorChange={setParagraphHtml} />
                  </div>
                </div>
              )}

              {cfg.question && (
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '14px',
                    fontWeight: '400',
                    color: '#2d3748',
                    fontSize: '1.1rem'
                  }}>
                    ❓ Question Text
                  </label>
                  <div style={{ 
                    border: '2px solid #e2e8f0', 
                    borderRadius: '10px', 
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                  }}>
                    <Editor apiKey={TINYMCE_KEY} value={questionHtml} init={{ ...baseEditorInit, height: 420 }} onEditorChange={setQuestionHtml} />
                  </div>
                </div>
              )}

              {cfg.table && (
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '14px',
                    fontWeight: '400',
                    color: '#2d3748',
                    fontSize: '1.1rem'
                  }}>
                    📊 Table / Extra Content
                  </label>
                  <div style={{ 
                    border: '2px solid #e2e8f0', 
                    borderRadius: '10px', 
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                  }}>
                    <Editor apiKey={TINYMCE_KEY} value={tableHtml} init={{ ...baseEditorInit, height: 300 }} onEditorChange={setTableHtml} />
                  </div>
                </div>
              )}

              {cfg.image && (
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '14px',
                    fontWeight: '400',
                    color: '#2d3748',
                    fontSize: '1.1rem'
                  }}>
                    🖼️ Upload Image
                  </label>
                  <div style={{
                    border: '2px dashed #cbd5e0',
                    borderRadius: '12px',
                    padding: '30px',
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, #fafafa, #f7fafc)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    position: 'relative'
                  }}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => setImageFile(e.target.files[0] || null)}
                      style={{ 
                        width: '100%',
                        height: '100%',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        opacity: 0,
                        cursor: 'pointer'
                      }}
                    />
                    <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📁</div>
                    <div style={{ fontSize: '1.1rem', color: '#4a5568', fontWeight: '500', marginBottom: '8px' }}>
                      Click to upload image
                    </div>
                    <div style={{ fontSize: '0.95rem', color: '#718096' }}>
                      Supports JPG, PNG, GIF • Max 5MB
                    </div>
                    {imageFile && (
                      <div style={{ 
                        marginTop: '16px',
                        padding: '12px 16px',
                        background: 'linear-gradient(135deg, #c6f6d5, #9ae6b4)',
                        color: '#22543d',
                        borderRadius: '8px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontWeight: '500'
                      }}>
                        ✅ Selected: {imageFile.name}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {cfg.choices && (
                <div>
                  <h4 style={{ 
                    margin: '0 0 24px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    color: '#1a202c',
                    fontSize: '1.3rem',
                    fontWeight: '400'
                  }}>
                    <span style={{
                      background: 'linear-gradient(135deg, #48bb78, #38a169)',
                      padding: '8px',
                      borderRadius: '8px',
                      fontSize: '1.1rem'
                    }}>
                      ☑️
                    </span>
                    Multiple Choice Options
                  </h4>
                  {choices.map((c, idx) => (
                    <div key={idx} style={{ 
                      marginBottom: '24px', 
                      border: '2px solid #e2e8f0', 
                      padding: '24px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #fafafa, #f7fafc)',
                      transition: 'all 0.2s ease'
                    }}>
                      <label style={{ 
                        display: 'block', 
                        marginBottom: '14px',
                        fontWeight: '400',
                        color: '#2d3748',
                        fontSize: '1.1rem'
                      }}>
                        <span style={{
                          background: '#4299e1',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '0.9rem',
                          marginRight: '8px'
                        }}>
                          {idx + 1}
                        </span>
                        Choice #{idx + 1}
                      </label>
                      <div style={{ 
                        border: '2px solid #e2e8f0', 
                        borderRadius: '10px', 
                        overflow: 'hidden',
                        marginBottom: '16px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                      }}>
                        <Editor apiKey={TINYMCE_KEY} value={c.text_html} init={{ ...baseEditorInit, height: 220 }} onEditorChange={(val) => updateChoice(idx, 'text_html', val)} />
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px'
                      }}>
                        <label style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '10px', 
                          cursor: 'pointer',
                          padding: '10px 16px',
                          background: c.is_correct ? 'linear-gradient(135deg, #c6f6d5, #9ae6b4)' : 'transparent',
                          borderRadius: '8px',
                          border: `2px solid ${c.is_correct ? '#48bb78' : '#e2e8f0'}`,
                          transition: 'all 0.2s ease'
                        }}>
                          <input 
                            type="checkbox" 
                            checked={c.is_correct} 
                            onChange={(e) => updateChoice(idx, 'is_correct', e.target.checked)}
                            style={{ 
                              transform: 'scale(1.3)',
                              accentColor: '#48bb78'
                            }}
                          /> 
                          <span style={{ 
                            fontWeight: '400', 
                            color: c.is_correct ? '#22543d' : '#4a5568',
                            fontSize: '1rem'
                          }}>
                            {c.is_correct ? '✅ Correct Answer' : 'Mark as Correct'}
                          </span>
                        </label>
                        {choices.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => removeChoice(idx)}
                            style={{
                              padding: '10px 18px',
                              background: 'linear-gradient(135deg, #e53e3e, #c53030)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '0.95rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              fontWeight: '500',
                              transition: 'all 0.2s ease',
                              boxShadow: '0 2px 8px rgba(229, 62, 62, 0.3)'
                            }}
                          >
                            🗑️ Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <button 
                      type="button" 
                      onClick={addChoice}
                      style={{
                        padding: '14px 28px',
                        background: 'linear-gradient(135deg, #4299e1, #3182ce)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontWeight: '400',
                        fontSize: '1rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '10px',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 4px 12px rgba(66, 153, 225, 0.3)'
                      }}
                    >
                      ➕ Add Choice
                    </button>
                  </div>
                </div>
              )}

              {cfg.specialChoices && (
                <div>
                  <h4 style={{ 
                    margin: '0 0 24px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    color: '#1a202c',
                    fontSize: '1.3rem',
                    fontWeight: '400'
                  }}>
                    <span style={{
                      background: 'linear-gradient(135deg, #9f7aea, #805ad5)',
                      padding: '8px',
                      borderRadius: '8px',
                      fontSize: '1.1rem'
                    }}>
                      🔀
                    </span>
                    Special Choices (Ordered)
                  </h4>
                  {specialChoices.map((sc, idx) => (
                    <div key={idx} style={{ 
                      marginBottom: '24px', 
                      border: '2px solid #e2e8f0', 
                      padding: '24px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #fafafa, #f7fafc)',
                      transition: 'all 0.2s ease'
                    }}>
                      <label style={{ 
                        display: 'block', 
                        marginBottom: '14px',
                        fontWeight: '400',
                        color: '#2d3748',
                        fontSize: '1.1rem'
                      }}>
                        <span style={{
                          background: '#9f7aea',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '0.9rem',
                          marginRight: '8px'
                        }}>
                          {idx + 1}
                        </span>
                        Special Choice #{idx + 1}
                      </label>
                      <div style={{ 
                        border: '2px solid #e2e8f0', 
                        borderRadius: '10px', 
                        overflow: 'hidden',
                        marginBottom: '16px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                      }}>
                        <Editor apiKey={TINYMCE_KEY} value={sc.text_html} init={{ ...baseEditorInit, height: 220 }} onEditorChange={(val) => updateSpecialChoice(idx, val)} />
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        {specialChoices.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => removeSpecialChoice(idx)}
                            style={{
                              padding: '10px 18px',
                              background: 'linear-gradient(135deg, #e53e3e, #c53030)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '0.95rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              fontWeight: '500',
                              transition: 'all 0.2s ease',
                              boxShadow: '0 2px 8px rgba(229, 62, 62, 0.3)'
                            }}
                          >
                            🗑️ Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <button 
                      type="button" 
                      onClick={addSpecialChoice}
                      style={{
                        padding: '14px 28px',
                        background: 'linear-gradient(135deg, #9f7aea, #805ad5)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontWeight: '400',
                        fontSize: '1rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '10px',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 4px 12px rgba(159, 122, 234, 0.3)'
                      }}
                    >
                      ➕ Add Special Choice
                    </button>
                  </div>

                  {cfg.specialOrder && (
                    <div style={{ 
                      marginTop: '24px',
                      padding: '20px',
                      background: 'linear-gradient(135deg, #fef5e7, #fed7d7)',
                      borderRadius: '12px',
                      border: '2px solid #ed8936'
                    }}>
                      <label style={{ 
                        display: 'block', 
                        marginBottom: '12px',
                        fontWeight: '400',
                        color: '#744210',
                        fontSize: '1.1rem'
                      }}>
                        🔢 Correct Order Sequence
                      </label>
                      <input 
                        type="text" 
                        placeholder="e.g., 2,0,1 (comma-separated, 0-based indices)"
                        onChange={(e) => {
                          const arr = e.target.value.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !Number.isNaN(n));
                          setSpecialCorrectOrder(arr);
                        }}
                        style={{
                          width: '100%',
                          padding: '14px 16px',
                          border: '2px solid #ed8936',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          background: 'white',
                          color: '#000000'
                        }}
                      />
                      <div style={{ fontSize: '0.9rem', color: '#744210', marginTop: '8px' }}>
                        Enter the indices in the correct order (0-based, comma-separated)
                      </div>
                    </div>
                  )}
                </div>
              )}

              {cfg.explanation && (
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '14px',
                    fontWeight: '400',
                    color: '#2d3748',
                    fontSize: '1.1rem'
                  }}>
                    💡 Explanation
                  </label>
                  <div style={{ 
                    border: '2px solid #e2e8f0', 
                    borderRadius: '10px', 
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                  }}>
                    <Editor apiKey={TINYMCE_KEY} value={explanationHtml} init={{ ...baseEditorInit, height: 300 }} onEditorChange={setExplanationHtml} />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div style={{ 
                textAlign: 'center', 
                marginTop: '40px',
                padding: '30px 0 10px 0'
              }}>
                <button 
                  type="submit"
                  style={{
                    padding: '18px 50px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontWeight: '400',
                    fontSize: '1.2rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '14px',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 12px 30px rgba(102, 126, 234, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.4)';
                  }}
                >
                  <span style={{ 
                    position: 'relative', 
                    zIndex: 2,
                    fontSize: '1.4rem'
                  }}>
                    📤
                  </span>
                  <span style={{ position: 'relative', zIndex: 2 }}>
                    Upload Question
                  </span>
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                    transition: 'left 0.5s ease'
                  }}></div>
                </button>
              </div>
            </div>
          </form>
        </section>
      </div>

      {/* Footer */}
      <div style={{ 
        textAlign: 'center', 
        marginTop: '50px', 
        padding: '30px 20px',
        color: '#718096',
        fontSize: '0.95rem',
        borderTop: '2px solid #e2e8f0',
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '30px', 
          marginBottom: '16px',
          flexWrap: 'wrap'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>📚 Exam Management</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>✨ Rich Text Editing</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>📱 Mobile Friendly</span>
        </div>
        <div style={{ fontWeight: '500', color: '#4a5568' }}>
          Question Uploader System • Built with React & TinyMCE
        </div>
      </div>
    </div>
  );
}
