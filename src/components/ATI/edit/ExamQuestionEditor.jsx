// components/ExamQuestionEditor.jsx
'use client';

import React, { useEffect, useState } from 'react';
import { Editor } from '@tinymce/tinymce-react';

const formatConfig = {
  1: { question: true, paragraph: false, image: false, table: false, choices: true, specialChoices: false, specialOrder: false, explanation: true },
  2: { question: true, paragraph: false, image: true,  table: false, choices: true, specialChoices: false, specialOrder: false, explanation: true },
  3: { question: true, paragraph: true,  image: true,  table: false, choices: true, specialChoices: false, specialOrder: false, explanation: true },
  4: { question: true, paragraph: true,  image: false, table: false, choices: true, specialChoices: false, specialOrder: false, explanation: true },
  5: { question: true, paragraph: false, image: false, table: true,  choices: true, specialChoices: false, specialOrder: false, explanation: true },
  6: { question: false,paragraph: true,  image: false, table: true,  choices: true, specialChoices: false, specialOrder: false, explanation: true },
};

const formatDescriptions = {
  1: "1️⃣ Question + Choices + Explanation + Correct Answer",
  2: "2️⃣ Question + Image + Choices + Explanation + Correct Answer",
  3: "3️⃣ Paragraph + Image + Question + Choices + Explanation + Correct Answer",
  4: "4️⃣ Paragraph + Question + Choices + Explanation + Correct Answer",
  5: "5️⃣ Question + Table + Choices + Explanation + Correct Answer",
  6: "6️⃣ Paragraph + Table + Choices + Explanation + Correct Answer",
};

export default function ExamQuestionEditor() {
  const TINYMCE_KEY = process.env.NEXT_PUBLIC_TINYMCE_API_KEY || '';
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

  const [exams, setExams] = useState([]);
  const [loadingExams, setLoadingExams] = useState(true);
  const [examId, setExamId] = useState('');
  const [examDetail, setExamDetail] = useState(null);
  const [loadingExamDetail, setLoadingExamDetail] = useState(false);
  const [questionId, setQuestionId] = useState(null);
  const [question, setQuestion] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);

  // CSRF token state
  const [csrfToken, setCsrfToken] = useState(null);

  // Fixed TinyMCE configuration - removed deprecated plugins
  const baseEditorInit = {
    menubar: false,
    plugins: 'advlist autolink lists link image charmap table code help',
    toolbar: 'undo redo | formatselect | fontfamily fontsize | bold italic underline | forecolor backcolor | alignleft aligncenter alignright | bullist numlist | link image | table | removeformat | code | help',
    font_family_formats: 'Inter=Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; Serif=Georgia, serif; "Times New Roman"=Times New Roman, Times, serif; "Courier New"=Courier New, Courier, monospace; Monospace=monospace',
    font_size_formats: '8px 10px 12px 14px 16px 18px 20px 24px 30px 36px',
    block_formats: 'Paragraph=p; Heading 1=h1; Heading 2=h2; Heading 3=h3; Heading 4=h4; Pre=pre',
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
    content_style: `
      body { 
        font-family: 'Inter', 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
        font-size: 14px; 
        color: #222; 
        line-height: 1.45; 
        font-weight: 400;
      }
      h1 { font-size: 28px; margin: 0 0 12px; font-weight: 400; color: #111; }
      h2 { font-size: 22px; margin: 0 0 10px; font-weight: 400; color: #222; }
      h3 { font-size: 18px; margin: 0 0 8px; font-weight: 400; color: #333; }
      h4 { font-size: 16px; margin: 0 0 6px; font-weight: 400; color: #333; }
      p { margin: 0 0 10px; font-weight: 400; }
      img { max-width: 100%; height: auto; }
    `,
    // Ensure proper emoji and symbol rendering
    entity_encoding: 'raw',
    convert_fonts_to_spans: false,
    forced_root_block: 'p',
  };

  // fetch CSRF token endpoint to ensure cookie set and get token
  async function fetchCsrfToken() {
    try {
      const res = await fetch(`${apiBase}/api/auth/csrf/`, {
        method: 'GET',
        credentials: 'include'
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

  useEffect(() => {
    async function loadExams() {
      setLoadingExams(true);
      try {
        // ensure CSRF cookie is set (useful if backend requires it for subsequent POST/PATCH)
        await fetchCsrfToken();

        const res = await fetch(`${apiBase}/api/ati/`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to load exams');
        const data = await res.json();
        setExams(data);
        if (data && data.length > 0) setExamId(String(data[0].id));
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingExams(false);
      }
    }
    loadExams();
  }, [apiBase]);

  // load exam detail when examId changes
  useEffect(() => {
    if (!examId) { setExamDetail(null); return; }
    async function load() {
      setLoadingExamDetail(true);
      try {
        const res = await fetch(`${apiBase}/api/ati/${examId}/`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to load exam detail');
        const data = await res.json();
        setExamDetail(data);
        // if there are questions, preselect first
        if (data.questions && data.questions.length > 0) {
          setQuestionId(data.questions[0].id);
          setQuestion({ ...data.questions[0] });
        } else {
          setQuestionId(null);
          setQuestion(null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingExamDetail(false);
      }
    }
    load();
  }, [examId, apiBase]);

  // when questionId changes (or examDetail changes) set question state
  useEffect(() => {
    if (!examDetail || !questionId) { setQuestion(null); return; }
    const q = examDetail.questions.find(q => q.id === Number(questionId));
    setQuestion(q ? { ...q } : null);
    setImageFile(null);
  }, [questionId, examDetail]);

  // when the question.format changes, normalize the question object to include only applicable fields
  useEffect(() => {
    if (!question) return;
    const cfg = formatConfig[Number(question.format)] || formatConfig[1];

    setQuestion(prev => {
      if (!prev) return prev;
      const next = { ...prev };

      // ensure arrays exist when expected
      if (cfg.choices && !Array.isArray(next.choices)) next.choices = [{ text_html: '', is_correct: false }];
      if (!cfg.choices) next.choices = [];

      if (cfg.specialChoices && !Array.isArray(next.specialchoices)) next.specialchoices = [{ text_html: '' }];
      if (!cfg.specialChoices) next.specialchoices = [];

      // If field not allowed by format, clear it (so save won't send)
      if (!cfg.question) next.question_html = '';
      if (!cfg.paragraph) next.paragraph_html = '';
      if (!cfg.table) next.table_html = '';
      if (!cfg.explanation) next.explanation_html = '';
      if (!cfg.image) {
        // keep existing image_url (don't delete); imageFile will be ignored when saving,
        // but we don't clear image_url client-side unless you want that behavior.
      }

      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question && question.format]);

  // choice helpers for the editor UI (only used when cfg.choices)
  function updateChoiceLocal(idx, field, value) {
    setQuestion(prev => {
      const q = { ...prev };
      q.choices = q.choices ? q.choices.map(c => ({ ...c })) : [];
      q.choices[idx][field] = value;
      return q;
    });
  }
  function addChoiceLocal() {
    setQuestion(prev => {
      const q = { ...prev };
      q.choices = q.choices ? [...q.choices] : [];
      q.choices.push({ text_html: '', is_correct: false });
      return q;
    });
  }
  function removeChoiceLocal(idx) {
    setQuestion(prev => {
      const q = { ...prev };
      q.choices = q.choices.filter((_, i) => i !== idx);
      return q;
    });
  }

  // special choice helpers
  function addSpecialChoiceLocal() {
    setQuestion(prev => {
      const q = { ...prev };
      q.specialchoices = q.specialchoices ? [...q.specialchoices] : [];
      q.specialchoices.push({ text_html: '' });
      return q;
    });
  }

  // Save: only include fields enabled for the current format
  async function handleSave() {
    if (!question) return alert('No question to save');
    const cfg = formatConfig[Number(question.format)] || formatConfig[1];

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('order', String(question.order ?? 1));
      fd.append('format', String(question.format ?? 1));

      if (cfg.question) fd.append('question_html', question.question_html || '');
      if (cfg.paragraph) fd.append('paragraph_html', question.paragraph_html || '');
      if (cfg.table) fd.append('table_html', question.table_html || '');
      if (cfg.explanation) fd.append('explanation_html', question.explanation_html || '');

      // only send choices when enabled
      if (cfg.choices && Array.isArray(question.choices)) {
        const choicesPayload = question.choices.map((c, i) => ({
          id: c.id, // keep existing id if present for updates
          text_html: c.text_html || '',
          is_correct: !!c.is_correct,
          order: c.order ?? i
        }));
        fd.append('choices', JSON.stringify(choicesPayload));
      }

      // only send specialchoices when enabled
      if (cfg.specialChoices && Array.isArray(question.specialchoices)) {
        const scPayload = question.specialchoices.map((sc, i) => ({
          id: sc.id,
          text_html: sc.text_html || '',
          order: sc.order ?? i
        }));
        fd.append('specialchoices', JSON.stringify(scPayload));
      }

      if (cfg.specialOrder && Array.isArray(question.special_correct_order)) {
        fd.append('special_correct_order', JSON.stringify(question.special_correct_order));
      }

      // image: only send new file when the format allows images
      if (cfg.image && imageFile) {
        fd.append('image', imageFile);
      }

      const token = csrfToken || await fetchCsrfToken();

      const res = await fetch(`${apiBase}/api/ati/questions/${question.id}/`, {
        method: 'PATCH',
        body: fd,
        credentials: 'include',
        headers: {
          ...(token ? { 'X-CSRFToken': token } : {})
          // Note: Do NOT set Content-Type when sending FormData; browser will set boundary.
        }
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        console.error('Save error', j);
        alert('Save failed — check console for details');
        return;
      }
      const updated = await res.json();
      alert('Saved');

      // update local examDetail and question state to reflect server canonical representation
      setExamDetail(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          questions: prev.questions.map(q => (q.id === updated.id ? updated : q)),
        };
      });
      setQuestion(updated);
      setImageFile(null);
    } catch (err) {
      console.error(err);
      alert('Network error while saving — see console');
    } finally {
      setSaving(false);
    }
  }

  const currentCfg = question ? (formatConfig[Number(question.format)] || formatConfig[1]) : null;

  return (
    <div className="editor-container">
      {/* Header Section */}
      <div className="header-section">
        <div className="header-content">
          <div className="header-icon">📝</div>
          <div className="header-text">
            <h1 className="page-title">Exam Question Editor</h1>
            <p className="page-subtitle">Create and edit ATI TEAS 7 exam questions with rich content and multiple formats</p>
          </div>
        </div>
      </div>

      {/* Control Cards Grid */}
      <div className="card-grid">
        <div className="control-card">
          <div className="card-header">
            <div className="card-icon-wrapper">
              <span className="card-icon" role="img" aria-label="Exam">📋</span>
            </div>
            <div className="card-title-section">
              <h3 className="card-title">Exam Selection</h3>
              <p className="card-description">Choose which exam to edit</p>
            </div>
          </div>
          <div className="card-content">
            {loadingExams ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <span>Loading available exams...</span>
              </div>
            ) : (
              <div className="select-wrapper">
                <select 
                  value={examId} 
                  onChange={e => setExamId(e.target.value)}
                  className="dark-select"
                >
                  <option value="">-- Select an exam --</option>
                  {exams.map(ex => (
                    <option key={ex.id} value={String(ex.id)}>
                      {ex.name} {ex.completed && '✅'}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {examDetail && (
          <div className="control-card">
            <div className="card-header">
              <div className="card-icon-wrapper">
                <span className="card-icon" role="img" aria-label="Question">❓</span>
              </div>
              <div className="card-title-section">
                <h3 className="card-title">Question Selection</h3>
                <p className="card-description">Select question to edit</p>
              </div>
            </div>
            <div className="card-content">
              <div className="select-wrapper">
                <select 
                  value={questionId || ''} 
                  onChange={e => setQuestionId(Number(e.target.value) || null)}
                  className="dark-select"
                >
                  <option value="">-- Select a question --</option>
                  {examDetail.questions.map(q => (
                    <option key={q.id} value={q.id}>
                      Question {q.order} • {formatDescriptions[q.format] || `Format ${q.format}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loadingExamDetail && (
        <div className="loading-overlay">
          <div className="loading-card">
            <div className="loading-spinner large"></div>
            <p>Loading exam details and questions...</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!question ? (
        <div className="empty-state">
          <div className="empty-icon" role="img" aria-label="Books">📚</div>
          <h3>No Question Selected</h3>
          <p>Select an exam and question from the dropdowns above to start editing</p>
        </div>
      ) : (
        /* Question Editor */
        <div className="question-editor">
          {/* Editor Header */}
          <div className="editor-header">
            <div className="editor-header-content">
              <div className="question-info">
                <h2>Editing Question #{question.order}</h2>
                <div className="format-indicator">
                  {formatDescriptions[question.format]}
                </div>
              </div>
              <div className="header-actions">
                <button 
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="save-button primary"
                >
                  {saving ? (
                    <>
                      <span className="button-spinner"></span>
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <span className="button-icon" role="img" aria-label="Save">💾</span>
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Editor Content */}
          <div className="editor-content">
            <div className="editor-grid">
              {/* Settings Panel */}
              <div className="settings-panel">
                <div className="panel-card">
                  <div className="panel-header">
                    <span className="panel-icon" role="img" aria-label="Settings">⚙️</span>
                    <h3 className="panel-title">Question Settings</h3>
                  </div>
                  <div className="panel-content">
                    <div className="form-group">
                      <label className="form-label">
                        <span className="label-text">Order Position</span>
                        <span className="label-icon" role="img" aria-label="Numbers">🔢</span>
                      </label>
                      <input 
                        type="number" 
                        value={question.order ?? 1} 
                        onChange={e => setQuestion(prev => ({ ...prev, order: Number(e.target.value) }))} 
                        min={1}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        <span className="label-text">Question Format</span>
                        <span className="label-icon" role="img" aria-label="Format">🎨</span>
                      </label>
                      <select 
                        value={question.format} 
                        onChange={e => setQuestion(prev => ({ ...prev, format: Number(e.target.value) }))}
                        className="format-select"
                      >
                        {Object.entries(formatDescriptions).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                      <div className="format-hint">
                        <span className="hint-icon" role="img" aria-label="Info">💡</span>
                        <span className="hint-text">
                          Active fields: {[ 
                            currentCfg?.question && 'Question',
                            currentCfg?.paragraph && 'Paragraph', 
                            currentCfg?.table && 'Table',
                            currentCfg?.image && 'Image',
                            currentCfg?.choices && 'Choices',
                            currentCfg?.specialChoices && 'Special Choices',
                            currentCfg?.explanation && 'Explanation'
                          ].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Area */}
              <div className="content-area">
                {/* Question Content */}
                {currentCfg?.question && (
                  <div className="content-section">
                    <div className="section-header">
                      <span className="section-icon" role="img" aria-label="Question">📝</span>
                      <h3 className="section-title">Question Content</h3>
                    </div>
                    <div className="section-content">
                      <Editor 
                        apiKey={TINYMCE_KEY} 
                        value={question.question_html || ''} 
                        init={{ ...baseEditorInit, height: 420 }} 
                        onEditorChange={(val) => setQuestion(prev => ({ ...prev, question_html: val }))} 
                      />
                    </div>
                  </div>
                )}

                {/* Paragraph Content */}
                {currentCfg?.paragraph && (
                  <div className="content-section">
                    <div className="section-header">
                      <span className="section-icon" role="img" aria-label="Paragraph">📄</span>
                      <h3 className="section-title">Paragraph Content</h3>
                    </div>
                    <div className="section-content">
                      <Editor 
                        apiKey={TINYMCE_KEY} 
                        value={question.paragraph_html || ''} 
                        init={{ ...baseEditorInit, height: 300 }} 
                        onEditorChange={(val) => setQuestion(prev => ({ ...prev, paragraph_html: val }))} 
                      />
                    </div>
                  </div>
                )}

                {/* Table Content */}
                {currentCfg?.table && (
                  <div className="content-section">
                    <div className="section-header">
                      <span className="section-icon" role="img" aria-label="Table">📊</span>
                      <h3 className="section-title">Table Content</h3>
                    </div>
                    <div className="section-content">
                      <Editor 
                        apiKey={TINYMCE_KEY} 
                        value={question.table_html || ''} 
                        init={{ ...baseEditorInit, height: 220 }} 
                        onEditorChange={(val) => setQuestion(prev => ({ ...prev, table_html: val }))} 
                      />
                    </div>
                  </div>
                )}

                {/* Explanation */}
                {currentCfg?.explanation && (
                  <div className="content-section">
                    <div className="section-header">
                      <span className="section-icon" role="img" aria-label="Explanation">💡</span>
                      <h3 className="section-title">Explanation</h3>
                    </div>
                    <div className="section-content">
                      <Editor 
                        apiKey={TINYMCE_KEY} 
                        value={question.explanation_html || ''} 
                        init={{ ...baseEditorInit, height: 220 }} 
                        onEditorChange={(val) => setQuestion(prev => ({ ...prev, explanation_html: val }))} 
                      />
                    </div>
                  </div>
                )}

                {/* Image Upload */}
                {currentCfg?.image && (
                  <div className="content-section">
                    <div className="section-header">
                      <span className="section-icon" role="img" aria-label="Image">🖼️</span>
                      <h3 className="section-title">Image</h3>
                    </div>
                    <div className="section-content">
                      <div className="image-section">
                        {question.image_url && (
                          <div className="current-image">
                            <label className="form-label">Current Image</label>
                            <div className="image-preview-container">
                              <img src={question.image_url} alt="question" className="preview-image" />
                            </div>
                          </div>
                        )}
                        <div className="upload-section">
                          <label className="form-label">Upload New Image</label>
                          <div className="file-upload-area">
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={e => setImageFile(e.target.files[0] || null)}
                              className="file-input"
                            />
                            <div className="upload-hint">
                              <span className="upload-icon" role="img" aria-label="Upload">📁</span>
                              <span>Click to browse or drag and drop</span>
                            </div>
                          </div>
                          {imageFile && (
                            <div className="file-selection">
                              <span className="selection-icon" role="img" aria-label="Selected">✅</span>
                              <span className="selection-text">Selected: {imageFile.name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Choices Section */}
                {currentCfg?.choices && Array.isArray(question.choices) && (
                  <div className="content-section">
                    <div className="section-header">
                      <span className="section-icon" role="img" aria-label="Choices">🔘</span>
                      <h3 className="section-title">Answer Choices</h3>
                    </div>
                    <div className="section-content">
                      <div className="choices-container">
                        {question.choices.map((c, idx) => (
                          <div key={c.id ?? idx} className="choice-card">
                            <div className="choice-header">
                              <span className="choice-label">Choice #{idx + 1}</span>
                              {question.choices.length > 1 && (
                                <button 
                                  type="button" 
                                  onClick={() => removeChoiceLocal(idx)}
                                  className="remove-button"
                                  title="Remove choice"
                                >
                                  <span className="remove-icon" role="img" aria-label="Remove">🗑️</span>
                                  Remove
                                </button>
                              )}
                            </div>
                            <div className="choice-editor">
                              <Editor 
                                apiKey={TINYMCE_KEY} 
                                value={c.text_html || ''} 
                                init={{ ...baseEditorInit, height: 180 }} 
                                onEditorChange={(val) => updateChoiceLocal(idx, 'text_html', val)} 
                              />
                            </div>
                            <label className="correct-toggle">
                              <input 
                                type="checkbox" 
                                checked={!!c.is_correct} 
                                onChange={(e) => updateChoiceLocal(idx, 'is_correct', e.target.checked)} 
                                className="toggle-input"
                              />
                              <span className="toggle-slider"></span>
                              <span className="toggle-label">
                                <span className="toggle-icon" role="img" aria-label="Correct">✅</span>
                                Correct Answer
                              </span>
                            </label>
                          </div>
                        ))}
                        <button type="button" onClick={addChoiceLocal} className="add-button">
                          <span className="add-icon" role="img" aria-label="Add">➕</span>
                          Add New Choice
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Special Choices Section */}
                {currentCfg?.specialChoices && Array.isArray(question.specialchoices) && (
                  <div className="content-section">
                    <div className="section-header">
                      <span className="section-icon" role="img" aria-label="Special">⭐</span>
                      <h3 className="section-title">Special Choices</h3>
                    </div>
                    <div className="section-content">
                      <div className="choices-container">
                        {question.specialchoices.map((sc, idx) => (
                          <div key={sc.id ?? idx} className="choice-card special">
                            <div className="choice-header">
                              <span className="choice-label">Special Choice #{idx + 1}</span>
                            </div>
                            <div className="choice-editor">
                              <Editor 
                                apiKey={TINYMCE_KEY} 
                                value={sc.text_html || ''} 
                                init={{ ...baseEditorInit, height: 180 }} 
                                onEditorChange={(val) => {
                                  const arr = (question.specialchoices || []).map(s => ({ ...s }));
                                  arr[idx].text_html = val;
                                  setQuestion(prev => ({ ...prev, specialchoices: arr }));
                                }} 
                              />
                            </div>
                          </div>
                        ))}
                        <button type="button" onClick={addSpecialChoiceLocal} className="add-button">
                          <span className="add-icon" role="img" aria-label="Add">➕</span>
                          Add Special Choice
                        </button>

                        {currentCfg?.specialOrder && (
                          <div className="order-section">
                            <div className="order-header">
                              <span className="order-icon" role="img" aria-label="Target">🎯</span>
                              <h4 className="order-title">Correct Order Configuration</h4>
                            </div>
                            <div className="order-content">
                              <label className="form-label">Correct Order Sequence</label>
                              <input 
                                type="text" 
                                placeholder="Example: 2, 0, 1"
                                defaultValue={(question.special_correct_order || []).join(', ')} 
                                onBlur={(e) => {
                                  const arr = e.target.value.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !Number.isNaN(n));
                                  setQuestion(prev => ({ ...prev, special_correct_order: arr }));
                                }}
                                className="order-input"
                              />
                              <div className="order-hint">
                                Enter comma-separated indices (0-based) representing the correct order
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .editor-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 24px;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          min-height: 100vh;
          font-weight: 400;
        }

        /* Header Section */
        .header-section {
          margin-bottom: 32px;
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 32px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          border: 1px solid #e2e8f0;
        }

        .header-icon {
          font-size: 48px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          padding: 16px;
          line-height: 1;
        }

        .header-text {
          flex: 1;
        }

        .page-title {
          font-size: 32px;
          color: #1e293b;
          margin: 0 0 8px 0;
          font-weight: 400;
          letter-spacing: -0.025em;
        }

        .page-subtitle {
          font-size: 16px;
          color: #64748b;
          margin: 0;
          font-weight: 400;
          line-height: 1.5;
        }

        /* Card Grid */
        .card-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }

        .control-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          border: 1px solid #e2e8f0;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .control-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }

        .card-header {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 20px;
        }

        .card-icon-wrapper {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          border-radius: 12px;
          padding: 12px;
          line-height: 1;
        }

        .card-icon {
          font-size: 20px;
          display: block;
          line-height: 1;
        }

        .card-title-section {
          flex: 1;
        }

        .card-title {
          font-size: 18px;
          color: #1e293b;
          margin: 0 0 4px 0;
          font-weight: 400;
        }

        .card-description {
          font-size: 14px;
          color: #64748b;
          margin: 0;
          font-weight: 400;
        }

        .select-wrapper {
          position: relative;
        }

        /* ADDED: ensure select can render emoji/fallback glyphs and increased input heights */
        .dark-select,
        .format-select {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #1e293b;
          border-radius: 10px;
          background: #1e293b;
          color: white;
          font-size: 14px;
          font-weight: 400;
          transition: all 0.2s ease;
          cursor: pointer;
          /* emoji & fallback fonts to improve glyph coverage on different OSes */
          font-family: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial,
                       "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", "EmojiSymbols", sans-serif;
          min-height: 48px; /* increased height spacing for inputs */
          display: inline-flex;
          align-items: center;
        }

        .dark-select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        /* Loading States */
        .loading-state {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px;
          color: #64748b;
          font-weight: 400;
        }

        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid #e2e8f0;
          border-top: 2px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .loading-spinner.large {
          width: 40px;
          height: 40px;
          border-width: 3px;
        }

        .loading-overlay {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 60px 20px;
        }

        .loading-card {
          text-align: center;
          padding: 40px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .loading-card p {
          margin: 16px 0 0 0;
          color: #64748b;
          font-weight: 400;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 80px 40px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .empty-icon {
          font-size: 64px;
          margin-bottom: 20px;
          opacity: 0.6;
          line-height: 1;
        }

        .empty-state h3 {
          font-size: 24px;
          color: #1e293b;
          margin: 0 0 12px 0;
          font-weight: 400;
        }

        .empty-state p {
          font-size: 16px;
          color: #64748b;
          margin: 0;
          font-weight: 400;
        }

        /* Question Editor */
        .question-editor {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }

        .editor-header {
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          color: white;
          padding: 0;
        }

        .editor-header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 32px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .question-info h2 {
          font-size: 24px;
          margin: 0 0 8px 0;
          font-weight: 400;
          color: white;
        }

        .format-indicator {
          background: rgba(255, 255, 255, 0.15);
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          font-weight: 400;
        }

        .save-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: #10b981;
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 400;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .save-button:hover:not(:disabled) {
          background: #059669;
          transform: translateY(-1px);
        }

        .save-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .button-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        /* Editor Content */
        .editor-content {
          padding: 0;
        }

        .editor-grid {
          display: grid;
          grid-template-columns: 320px 1fr;
          min-height: 600px;
        }

        /* Settings Panel */
        .settings-panel {
          background: #f8fafc;
          border-right: 1px solid #e2e8f0;
          padding: 24px;
        }

        .panel-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #f1f5f9;
        }

        .panel-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 2px solid #f1f5f9;
        }

        .panel-icon {
          font-size: 18px;
          line-height: 1;
        }

        .panel-title {
          font-size: 16px;
          color: #1e293b;
          margin: 0;
          font-weight: 400;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          color: #374151;
          font-size: 14px;
          font-weight: 400;
        }

        .label-text {
          flex: 1;
        }

        .label-icon {
          font-size: 14px;
          opacity: 0.7;
          line-height: 1;
        }

        .form-input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 400;
          transition: all 0.2s ease;
          min-height: 48px; /* increased input height spacing */
          box-sizing: border-box;
        }

        .form-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .format-select {
          border: 1px solid #d1d5db;
          background: white;
          color: #1e293b;
          min-height: 48px; /* increased height spacing */
          display: inline-flex;
          align-items: center;
          padding: 12px 14px;
        }

        .format-hint {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          margin-top: 8px;
          padding: 12px;
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 8px;
          font-size: 12px;
          color: #0369a1;
          font-weight: 400;
        }

        .hint-icon {
          font-size: 14px;
          flex-shrink: 0;
          line-height: 1;
        }

        .hint-text {
          line-height: 1.4;
        }

        /* Content Area */
        .content-area {
          padding: 24px;
          background: white;
          overflow-y: auto;
        }

        .content-section {
          margin-bottom: 32px;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 2px solid #f1f5f9;
        }

        .section-icon {
          font-size: 18px;
          line-height: 1;
        }

        .section-title {
          font-size: 18px;
          color: #1e293b;
          margin: 0;
          font-weight: 400;
        }

        .section-content {
          space-y: 16px;
        }

        /* Image Section */
        .image-section {
          space-y: 20px;
        }

        .current-image {
          space-y: 12px;
        }

        .image-preview-container {
          border: 2px dashed #d1d5db;
          border-radius: 12px;
          padding: 16px;
          background: #fafafa;
        }

        .preview-image {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          display: block;
          margin: 0 auto;
        }

        .upload-section {
          space-y: 12px;
        }

        .file-upload-area {
          position: relative;
          border: 2px dashed #cbd5e0;
          border-radius: 12px;
          padding: 32px;
          text-align: center;
          background: #fafafa;
          transition: all 0.2s ease;
        }

        .file-upload-area:hover {
          border-color: #3b82f6;
          background: #f0f9ff;
        }

        .file-input {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
        }

        .upload-hint {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          color: #64748b;
          font-size: 14px;
          font-weight: 400;
        }

        .upload-icon {
          font-size: 24px;
          line-height: 1;
        }

        .file-selection {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          background: #f0fff4;
          border: 1px solid #9ae6b4;
          border-radius: 8px;
          color: #276749;
          font-size: 14px;
          font-weight: 400;
        }

        .selection-icon {
          font-size: 16px;
          line-height: 1;
        }

        /* Choices */
        .choices-container {
          space-y: 16px;
        }

        .choice-card {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          background: #fafbfc;
          transition: all 0.2s ease;
        }

        .choice-card:hover {
          border-color: #cbd5e0;
          background: white;
        }

        .choice-card.special {
          border-left: 4px solid #8b5cf6;
        }

        .choice-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .choice-label {
          font-size: 14px;
          color: #374151;
          font-weight: 400;
        }

        .remove-button {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 400;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .remove-button:hover {
          background: #fecaca;
        }

        .remove-icon {
          font-size: 12px;
          line-height: 1;
        }

        .choice-editor {
          margin-bottom: 16px;
        }

        .correct-toggle {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          font-size: 14px;
          color: #374151;
          font-weight: 400;
        }

        .toggle-input {
          display: none;
        }

        .toggle-slider {
          width: 44px;
          height: 24px;
          background: #d1d5db;
          border-radius: 12px;
          position: relative;
          transition: all 0.2s ease;
        }

        .toggle-slider::before {
          content: '';
          position: absolute;
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          top: 2px;
          left: 2px;
          transition: all 0.2s ease;
        }

        .toggle-input:checked + .toggle-slider {
          background: #10b981;
        }

        .toggle-input:checked + .toggle-slider::before {
          transform: translateX(20px);
        }

        .toggle-label {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .toggle-icon {
          font-size: 14px;
          line-height: 1;
        }

        .add-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: #f8fafc;
          color: #374151;
          border: 2px dashed #cbd5e0;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 400;
          cursor: pointer;
          transition: all 0.2s ease;
          width: 100%;
          justify-content: center;
          min-height: 48px; /* spacing for add button */
        }

        .add-button:hover {
          background: #f1f5f9;
          border-color: #94a3b8;
        }

        .add-icon {
          font-size: 16px;
          line-height: 1;
        }

        /* Order Section */
        .order-section {
          margin-top: 24px;
          padding: 20px;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }

        .order-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .order-icon {
          font-size: 16px;
          line-height: 1;
        }

        .order-title {
          font-size: 16px;
          color: #1e293b;
          margin: 0;
          font-weight: 400;
        }

        .order-input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 400;
          font-family: monospace;
          min-height: 48px; /* increased spacing for order input */
          box-sizing: border-box;
        }

        .order-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .order-hint {
          margin-top: 8px;
          font-size: 12px;
          color: #64748b;
          font-weight: 400;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Ensure proper emoji and symbol display */
        [role="img"] {
          font-family: "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Android Emoji", "EmojiSymbols", "EmojiOne Mozilla", "Twemoji Mozilla", "Segoe UI Symbol", sans-serif;
          font-style: normal;
          font-weight: normal;
          line-height: 1;
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .editor-grid {
            grid-template-columns: 1fr;
          }
          
          .settings-panel {
            border-right: none;
            border-bottom: 1px solid #e2e8f0;
          }
        }

        @media (max-width: 768px) {
          .editor-container {
            padding: 16px;
          }

          .header-content {
            flex-direction: column;
            text-align: center;
            padding: 24px;
          }

          .header-icon {
            align-self: center;
          }

          .card-grid {
            grid-template-columns: 1fr;
          }

          .editor-header-content {
            flex-direction: column;
            align-items: stretch;
            gap: 16px;
          }

          .header-actions {
            align-self: stretch;
          }

          .save-button {
            width: 100%;
            justify-content: center;
          }

          .content-area {
            padding: 16px;
          }

          .choice-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .remove-button {
            align-self: flex-start;
          }
        }

        @media (max-width: 480px) {
          .header-content {
            padding: 20px;
          }

          .page-title {
            font-size: 24px;
          }

          .control-card, .panel-card {
            padding: 16px;
          }

          .editor-header-content {
            padding: 20px;
          }

          .question-info h2 {
            font-size: 20px;
          }

          .format-indicator {
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
}
