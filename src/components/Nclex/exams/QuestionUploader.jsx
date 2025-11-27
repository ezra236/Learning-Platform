import React, { useEffect, useState } from 'react';
import styles from './QuestionUploader.module.css';
import { Editor } from '@tinymce/tinymce-react';
import Success from './Success';

async function fetchCsrf() {
  await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/csrf/`, {
    credentials: 'include',
  });
}

export default function QuestionUploader() {
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [format, setFormat] = useState('1');
  const [order, setOrder] = useState(1);

  // Shared fields
  const [questionText, setQuestionText] = useState('');
  const [explanation, setExplanation] = useState('');
  const [paragraph, setParagraph] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [blankAnswer, setBlankAnswer] = useState('');

  // Headings for format 5 (now editors)
  const [headings, setHeadings] = useState(['', '', '']);

  // Choices (existing)
  const [choices, setChoices] = useState([
    { label: 'A', text: '', is_correct: false, correct_order: null },
    { label: 'B', text: '', is_correct: false, correct_order: null },
  ]);

  // Cases (for formats 5,6,7,9)
  const [cases, setCases] = useState([{ heading: '', case_text: '' }]);

  // --- NEW for format 9 ---
  const [actions, setActions] = useState([{ text: '', is_correct: false }]);
  const [potentials, setPotentials] = useState([{ text: '', is_correct: false }]);
  const [parameters, setParameters] = useState([{ text: '', is_correct: false }]);
  // --- end new ---

  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadExams();
  }, []);

  async function loadExams() {
    const resp = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/nclex/exams/`);
    const data = await resp.json();
    setExams(data);
    if (data.length && !selectedExam) {
      setSelectedExam(data[0].id);
    }
  }

  async function markExamCompleted() {
    if (!selectedExam) return alert('Select an exam first');
    const examObj = exams.find(x => x.id === Number(selectedExam));
    if (!examObj) return alert('Selected exam not found');
    if (examObj.is_completed) return alert('Exam already completed');

    const ok = confirm(`Mark exam "${examObj.name}" as completed? This will prevent adding more questions.`);
    if (!ok) return;

    setLoading(true);
    await fetchCsrf();
    const csrftoken = (document.cookie.match(/csrftoken=([^;]+)/) || [])[1] || '';
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/nclex/exams/${selectedExam}/`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken,
        },
        body: JSON.stringify({ is_completed: true }),
      });
      const data = await resp.json();
      setLoading(false);
      if (resp.ok) {
        setExams(prev => prev.map(e => (e.id === Number(selectedExam) ? { ...e, is_completed: true } : e)));
        setSuccessMessage('🎉 Exam marked as completed successfully!');
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        alert(JSON.stringify(data));
      }
    } catch (err) {
      setLoading(false);
      alert(String(err));
    }
  }

  function ensureChoicesMin() {
    if (choices.length < 2) {
      setChoices(prev => {
        const copy = [...prev];
        while (copy.length < 2) copy.push({ label: `C${copy.length + 1}`, text: '', is_correct: false, correct_order: null });
        return copy;
      });
    }
  }

  function addChoice() {
    setChoices(prev => {
      const nextLabel = String.fromCharCode(65 + prev.length) || `CH${prev.length+1}`;
      return [...prev, { label: nextLabel, text: '', is_correct: false, correct_order: null }];
    });
  }

  function removeChoice(idx) {
    setChoices(prev => prev.filter((_, i) => i !== idx));
  }

  function updateChoice(idx, key, value) {
    setChoices(prev => prev.map((c, i) => (i === idx ? { ...c, [key]: value } : c)));
  }

  function addCase() {
    setCases(prev => [...prev, { heading: '', case_text: '' }]);
  }

  function removeCase(idx) {
    setCases(prev => prev.filter((_, i) => i !== idx));
  }

  function updateCase(idx, key, value) {
    setCases(prev => prev.map((c, i) => (i === idx ? { ...c, [key]: value } : c)));
  }

  // --- NEW: actions/potentials/parameters helpers ---
  function addAction() { setActions(prev => [...prev, { text: '', is_correct: false }]); }
  function removeAction(idx) { setActions(prev => prev.filter((_, i) => i !== idx)); }
  function updateAction(idx, key, val) { setActions(prev => prev.map((a, i) => (i === idx ? { ...a, [key]: val } : a))); }

  function addPotential() { setPotentials(prev => [...prev, { text: '', is_correct: false }]); }
  function removePotential(idx) { setPotentials(prev => prev.filter((_, i) => i !== idx)); }
  function updatePotential(idx, key, val) { setPotentials(prev => prev.map((p, i) => (i === idx ? { ...p, [key]: val } : p))); }

  function addParameter() { setParameters(prev => [...prev, { text: '', is_correct: false }]); }
  function removeParameter(idx) { setParameters(prev => prev.filter((_, i) => i !== idx)); }
  function updateParameter(idx, key, val) { setParameters(prev => prev.map((p, i) => (i === idx ? { ...p, [key]: val } : p))); }
  // --- end new ---

  function getEditorInit(height = 300) {
    return {
      height,
      menubar: true,
      plugins: [
        'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
        'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
        'insertdatetime', 'media', 'table', 'help', 'wordcount'
      ],
      toolbar:
        'undo redo | fontselect fontsizeselect | bold italic underline strikethrough | forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | link image | code | fullscreen',
      font_formats:
        'Arial=arial,helvetica,sans-serif; Verdana=verdana,geneva; Tahoma=tahoma,verdana,segui; Georgia=georgia,palatino; Times New Roman=times new roman,times; Courier New=courier new,courier,monospace; Lucida Sans Unicode=lucida sans unicode,lucida grande;',
      fontsize_formats: '10px 12px 14px 16px 18px 20px 24px 30px 36px',
      content_style: 'body { font-family: Arial,Helvetica,sans-serif; font-size:14px }',
      automatic_uploads: false,
    };
  }

  async function uploadImage(file) {
    const form = new FormData();
    form.append('file', file);
    await fetchCsrf();
    const resp = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/nclex/upload-image/`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'X-CSRFToken': (document.cookie.match(/csrftoken=([^;]+)/) || [])[1] || '',
      },
      body: form,
    });
    if (resp.ok) {
      const json = await resp.json();
      setImageUrl(json.url);
    } else {
      const err = await resp.json();
      alert(JSON.stringify(err));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedExam) return alert('Select an exam first');
    setLoading(true);
    await fetchCsrf();

    const payload = {
      exam_id: selectedExam,
      format: Number(format),
      order: Number(order || 0),
      question_text: questionText,
      explanation,
      paragraph,
      image_url: imageUrl,
      blank_answer: blankAnswer,
      heading1: format === '5' ? headings[0] || '' : '',
      heading2: format === '5' ? headings[1] || '' : '',
      heading3: format === '5' ? headings[2] || '' : '',
      choices: choices.map((c, idx) => ({
        label: c.label || `Choice ${idx + 1}`,
        text: c.text || '',
        is_correct: !!c.is_correct,
        correct_order: c.correct_order ? Number(c.correct_order) : null,
        display_order: idx + 1,
      })),
      cases: cases.filter(c => c.heading || c.case_text).map((c, idx) => ({ heading: c.heading, case_text: c.case_text, display_order: idx + 1 })),
      // new arrays for format 9
      actions: actions.filter(a => a.text).map((a, idx) => ({ text: a.text, is_correct: !!a.is_correct, display_order: idx + 1 })),
      potentials: potentials.filter(p => p.text).map((p, idx) => ({ text: p.text, is_correct: !!p.is_correct, display_order: idx + 1 })),
      parameters: parameters.filter(p => p.text).map((p, idx) => ({ text: p.text, is_correct: !!p.is_correct, display_order: idx + 1 })),
    };

    const examObj = exams.find(x => x.id === Number(selectedExam));
    if (examObj && examObj.is_completed) {
      setLoading(false);
      return alert('This exam is already completed. Cannot add questions.');
    }

    const resp = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/nclex/questions/create/`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': (document.cookie.match(/csrftoken=([^;]+)/) || [])[1] || '',
      },
      body: JSON.stringify(payload),
    });

    const data = await resp.json();
    setLoading(false);
    if (resp.ok) {
      setSuccessMessage('🎉 Question uploaded successfully!');
      // reset relevant fields
      setQuestionText('');
      setExplanation('');
      setParagraph('');
      setBlankAnswer('');
      setImageUrl('');
      setHeadings(['', '', '']);
      setChoices([{ label: 'A', text: '' }, { label: 'B', text: '' }]);
      setCases([{ heading: '', case_text: '' }]);
      // clear format 9 lists
      setActions([{ text: '', is_correct: false }]);
      setPotentials([{ text: '', is_correct: false }]);
      setParameters([{ text: '', is_correct: false }]);
      setTimeout(() => setSuccessMessage(''), 5000);
    } else {
      alert(JSON.stringify(data));
    }
  }

  // rendering helpers: choices + cases already present above

  function renderFormat9Lists() {
    return (
      <>
        {/* Actions */}
        <div className={styles.block}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionIcon}>⚡</span>
            <h3 className={styles.sectionTitle}>Action(s) to Take</h3>
            <button type="button" className={styles.addButton} onClick={addAction} aria-label="Add action">➕ Add Action</button>
          </div>
          {actions.map((a, idx) => {
            const id = `action-text-${idx}`;
            return (
              <div key={idx} className={styles.smallItem}>
                <div className={styles.smallHeader}>
                  <span className={styles.smallIndex}>#{idx + 1}</span>
                  <button type="button" className={styles.removeButton} onClick={() => removeAction(idx)} aria-label={`Remove action ${idx+1}`}>🗑️</button>
                </div>
                <div className={styles.editorContainer}>
                  <label htmlFor={id} className={styles.visibleLabel}>Action text</label>
                  <Editor
                    id={id}
                    textareaName={id}
                    apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                    init={getEditorInit(220)}
                    value={a.text}
                    onEditorChange={(val) => updateAction(idx, 'text', val)}
                  />
                </div>
                <label className={styles.controlLabel}>
                  <input type="checkbox" checked={!!a.is_correct} onChange={(e) => updateAction(idx, 'is_correct', e.target.checked)} />
                  <span className={styles.controlText}>Mark as correct</span>
                </label>
              </div>
            );
          })}
        </div>

        {/* Potentials */}
        <div className={styles.block}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionIcon}>🩺</span>
            <h3 className={styles.sectionTitle}>Potential Condition(s)</h3>
            <button type="button" className={styles.addButton} onClick={addPotential} aria-label="Add potential">➕ Add Potential</button>
          </div>
          {potentials.map((p, idx) => {
            const id = `potential-text-${idx}`;
            return (
              <div key={idx} className={styles.smallItem}>
                <div className={styles.smallHeader}>
                  <span className={styles.smallIndex}>#{idx + 1}</span>
                  <button type="button" className={styles.removeButton} onClick={() => removePotential(idx)} aria-label={`Remove potential ${idx+1}`}>🗑️</button>
                </div>
                <div className={styles.editorContainer}>
                  <label htmlFor={id} className={styles.visibleLabel}>Potential text</label>
                  <Editor
                    id={id}
                    textareaName={id}
                    apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                    init={getEditorInit(220)}
                    value={p.text}
                    onEditorChange={(val) => updatePotential(idx, 'text', val)}
                  />
                </div>
                <label className={styles.controlLabel}>
                  <input type="checkbox" checked={!!p.is_correct} onChange={(e) => updatePotential(idx, 'is_correct', e.target.checked)} />
                  <span className={styles.controlText}>Mark as correct</span>
                </label>
              </div>
            );
          })}
        </div>

        {/* Parameters */}
        <div className={styles.block}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionIcon}>📈</span>
            <h3 className={styles.sectionTitle}>Parameter(s) to Monitor</h3>
            <button type="button" className={styles.addButton} onClick={addParameter} aria-label="Add parameter">➕ Add Parameter</button>
          </div>
          {parameters.map((p, idx) => {
            const id = `parameter-text-${idx}`;
            return (
              <div key={idx} className={styles.smallItem}>
                <div className={styles.smallHeader}>
                  <span className={styles.smallIndex}>#{idx + 1}</span>
                  <button type="button" className={styles.removeButton} onClick={() => removeParameter(idx)} aria-label={`Remove parameter ${idx+1}`}>🗑️</button>
                </div>
                <div className={styles.editorContainer}>
                  <label htmlFor={id} className={styles.visibleLabel}>Parameter text</label>
                  <Editor
                    id={id}
                    textareaName={id}
                    apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                    init={getEditorInit(220)}
                    value={p.text}
                    onEditorChange={(val) => updateParameter(idx, 'text', val)}
                  />
                </div>
                <label className={styles.controlLabel}>
                  <input type="checkbox" checked={!!p.is_correct} onChange={(e) => updateParameter(idx, 'is_correct', e.target.checked)} />
                  <span className={styles.controlText}>Mark as correct</span>
                </label>
              </div>
            );
          })}
        </div>
      </>
    );
  }

  function renderChoicesUI() {
    ensureChoicesMin();
    const f = Number(format);
    const showCorrectOrder = f === 8;
    const showCorrectCheckbox = f !== 8;
    return (
      <div className={styles.choicesSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionIcon}>🔘</span>
          <h3 className={styles.sectionTitle}>Answer Choices</h3>
          <button type="button" onClick={addChoice} className={styles.addButton} aria-label="Add choice">
            <span className={styles.buttonIcon}>➕</span>
            Add Choice
          </button>
        </div>
        {choices.map((c, idx) => {
          const choiceTextId = `choice-text-${idx}`;
          const choiceCorrectId = `choice-correct-${idx}`;
          const choiceOrderId = `choice-order-${idx}`;
          return (
            <div key={idx} className={styles.choiceCard}>
              <div className={styles.choiceHeader}>
                <div className={styles.choiceLabel}>{c.label}</div>
                <button
                  type="button"
                  onClick={() => removeChoice(idx)}
                  className={styles.removeButton}
                  title="Remove choice"
                  aria-label={`Remove choice ${idx + 1}`}
                >
                  🗑️
                </button>
              </div>

              <div className={styles.editorContainer}>
                <label htmlFor={choiceTextId} className={styles.visibleLabel}>
                  Choice {idx + 1} text
                </label>
                <Editor
                  id={choiceTextId}
                  textareaName={choiceTextId}
                  apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                  init={getEditorInit(320)}
                  value={c.text}
                  onEditorChange={(val) => updateChoice(idx, 'text', val)}
                />
              </div>

              <div className={styles.choiceControls}>
                {showCorrectCheckbox && (
                  <label className={styles.controlLabel} htmlFor={choiceCorrectId}>
                    <input
                      id={choiceCorrectId}
                      type="checkbox"
                      checked={!!c.is_correct}
                      onChange={(e) => updateChoice(idx, 'is_correct', e.target.checked)}
                      className={styles.checkbox}
                    />
                    <span className={styles.controlText}>✅ Correct Answer</span>
                  </label>
                )}

                {showCorrectOrder && (
                  <label className={styles.controlLabel} htmlFor={choiceOrderId}>
                    <span className={styles.controlText}>🔢 Correct Order:</span>
                    <input
                      id={choiceOrderId}
                      type="number"
                      value={c.correct_order || ''}
                      onChange={(e) => updateChoice(idx, 'correct_order', e.target.value ? Number(e.target.value) : null)}
                      className={styles.orderInput}
                      min={1}
                    />
                  </label>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  function renderCasesUI() {
    return (
      <div className={styles.casesSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionIcon}>📋</span>
          <h3 className={styles.sectionTitle}>Case Headings & Texts</h3>
          <button type="button" onClick={addCase} className={styles.addButton} aria-label="Add case">
            <span className={styles.buttonIcon}>➕</span>
            Add Case
          </button>
        </div>
        {cases.map((c, idx) => {
          const caseHeadingId = `case-heading-${idx}`;
          const caseTextId = `case-text-${idx}`;
          return (
            <div key={idx} className={styles.caseCard}>
              <div className={styles.caseHeader}>
                <h4 className={styles.caseTitle}>Case {idx + 1}</h4>
                <button
                  type="button"
                  onClick={() => removeCase(idx)}
                  className={styles.removeButton}
                  title="Remove case"
                  aria-label={`Remove case ${idx + 1}`}
                >
                  🗑️
                </button>
              </div>

              <div className={styles.editorContainer}>
                <label htmlFor={caseHeadingId} className={styles.visibleLabel}>
                  Case {idx + 1} heading
                </label>
                <Editor
                  id={caseHeadingId}
                  textareaName={caseHeadingId}
                  apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                  init={getEditorInit(360)}
                  value={c.heading}
                  onEditorChange={(val) => updateCase(idx, 'heading', val)}
                />
              </div>

              <div className={styles.editorContainer}>
                <label htmlFor={caseTextId} className={styles.visibleLabel}>
                  Case {idx + 1} text
                </label>
                <Editor
                  id={caseTextId}
                  textareaName={caseTextId}
                  apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                  init={getEditorInit(420)}
                  value={c.case_text}
                  onEditorChange={(val) => updateCase(idx, 'case_text', val)}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  function formatSpecificUI() {
    const f = Number(format);
    switch (f) {
      case 1:
      case 4:
        return (
          <>
            <div className={styles.block}>
              <label className={styles.blockLabel} htmlFor="question-text-editor">
                <span className={styles.labelIcon}>❓</span>
                Question Text
              </label>
              <div className={styles.editorContainer}>
                <Editor
                  id="question-text-editor"
                  textareaName="question-text-editor"
                  apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                  init={getEditorInit(420)}
                  value={questionText}
                  onEditorChange={(val) => setQuestionText(val)}
                />
              </div>
            </div>

            {f === 4 && (
              <div className={styles.block}>
                <label className={styles.blockLabel} htmlFor="image-file-input">
                  <span className={styles.labelIcon}>🖼️</span>
                  Image (optional)
                </label>
                <input
                  id="image-file-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadImage(file);
                  }}
                  className={styles.fileInput}
                />
                {imageUrl && (
                  <div className={styles.imagePreview}>
                    <span className={styles.previewText}>📸 Uploaded:</span>
                    <a href={imageUrl} target="_blank" rel="noreferrer" className={styles.imageLink}>
                      {imageUrl}
                    </a>
                  </div>
                )}
              </div>
            )}

            <div className={styles.block}>{renderChoicesUI()}</div>

            <div className={styles.block}>
              <label className={styles.blockLabel} htmlFor="explanation-editor">
                <span className={styles.labelIcon}>💡</span>
                Explanation
              </label>
              <div className={styles.editorContainer}>
                <Editor
                  id="explanation-editor"
                  textareaName="explanation-editor"
                  apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                  init={getEditorInit(340)}
                  value={explanation}
                  onEditorChange={(val) => setExplanation(val)}
                />
              </div>
            </div>
          </>
        );

      case 2:
        return (
          <>
            <div className={styles.block}>
              <label className={styles.blockLabel} htmlFor="question-text-editor">
                <span className={styles.labelIcon}>❓</span>
                Question Text (use <code className={styles.code}>{"{{answer}}"}</code> for blank)
              </label>
              <div className={styles.editorContainer}>
                <Editor
                  id="question-text-editor"
                  textareaName="question-text-editor"
                  apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                  init={getEditorInit(420)}
                  value={questionText}
                  onEditorChange={(val) => setQuestionText(val)}
                />
              </div>
            </div>

            <div className={styles.block}>
              <label className={styles.blockLabel} htmlFor="blank-answer-editor">
                <span className={styles.labelIcon}>✅</span>
                Correct Answer for Blank
              </label>
              <div className={styles.editorContainer}>
                <Editor
                  id="blank-answer-editor"
                  textareaName="blank-answer-editor"
                  apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                  init={getEditorInit(360)}
                  value={blankAnswer}
                  onEditorChange={(val) => setBlankAnswer(val)}
                />
              </div>
            </div>

            <div className={styles.block}>
              <label className={styles.blockLabel} htmlFor="explanation-editor">
                <span className={styles.labelIcon}>💡</span>
                Explanation
              </label>
              <div className={styles.editorContainer}>
                <Editor
                  id="explanation-editor"
                  textareaName="explanation-editor"
                  apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                  init={getEditorInit(340)}
                  value={explanation}
                  onEditorChange={(val) => setExplanation(val)}
                />
              </div>
            </div>
          </>
        );

      case 3:
        return (
          <>
            <div className={styles.block}>
              <label className={styles.blockLabel} htmlFor="question-text-editor">
                <span className={styles.labelIcon}>❓</span>
                Question Text (use multiple <code className={styles.code}>{"{{answer}}"}</code> markers)
              </label>
              <div className={styles.editorContainer}>
                <Editor
                  id="question-text-editor"
                  textareaName="question-text-editor"
                  apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                  init={getEditorInit(420)}
                  value={questionText}
                  onEditorChange={(val) => setQuestionText(val)}
                />
              </div>
            </div>

            <div className={styles.block}>
              <div className={styles.note}>
                <span className={styles.noteIcon}>💡</span>
                Make sure the number of correct choices equals the number of blanks.
              </div>
              {renderChoicesUI()}
            </div>

            <div className={styles.block}>
              <label className={styles.blockLabel} htmlFor="explanation-editor">
                <span className={styles.labelIcon}>💡</span>
                Explanation
              </label>
              <div className={styles.editorContainer}>
                <Editor
                  id="explanation-editor"
                  textareaName="explanation-editor"
                  apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                  init={getEditorInit(300)}
                  value={explanation}
                  onEditorChange={(val) => setExplanation(val)}
                />
              </div>
            </div>
          </>
        );

      case 5:
        return (
          <>
            <div className={styles.block}>
              <label className={styles.blockLabel} htmlFor="paragraph-editor">
                <span className={styles.labelIcon}>📄</span>
                Paragraph
              </label>
              <div className={styles.editorContainer}>
                <Editor
                  id="paragraph-editor"
                  textareaName="paragraph-editor"
                  apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                  init={getEditorInit(420)}
                  value={paragraph}
                  onEditorChange={(val) => setParagraph(val)}
                />
              </div>
            </div>

            <div className={styles.block}>
              {renderCasesUI()}
            </div>

            <div className={styles.block}>
              <label className={styles.blockLabel} htmlFor="question-text-editor-format5">
                <span className={styles.labelIcon}>❓</span>
                Question
              </label>
              <div className={styles.editorContainer}>
                <Editor
                  id="question-text-editor-format5"
                  textareaName="question-text-editor-format5"
                  apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                  init={getEditorInit(480)}
                  value={questionText}
                  onEditorChange={(val) => setQuestionText(val)}
                />
              </div>
            </div>

            <div className={styles.block}>
              <label className={styles.blockLabel}>
                <span className={styles.labelIcon}>📑</span>
                Headings (only format 5)
              </label>

              <div className={styles.headingsGrid}>
                <div className={styles.headingEditor}>
                  <label htmlFor="heading-1-editor" className={styles.visibleLabel}>Heading 1</label>
                  <Editor
                    id="heading-1-editor"
                    textareaName="heading-1-editor"
                    apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                    init={getEditorInit(520)}
                    value={headings[0]}
                    onEditorChange={(val) => setHeadings([val, headings[1], headings[2]])}
                  />
                </div>
                <div className={styles.headingEditor}>
                  <label htmlFor="heading-2-editor" className={styles.visibleLabel}>Heading 2</label>
                  <Editor
                    id="heading-2-editor"
                    textareaName="heading-2-editor"
                    apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                    init={getEditorInit(520)}
                    value={headings[1]}
                    onEditorChange={(val) => setHeadings([headings[0], val, headings[2]])}
                  />
                </div>
                <div className={styles.headingEditor}>
                  <label htmlFor="heading-3-editor" className={styles.visibleLabel}>Heading 3</label>
                  <Editor
                    id="heading-3-editor"
                    textareaName="heading-3-editor"
                    apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                    init={getEditorInit(520)}
                    value={headings[2]}
                    onEditorChange={(val) => setHeadings([headings[0], headings[1], val])}
                  />
                </div>
              </div>
            </div>

            <div className={styles.block}>
              {renderChoicesUI()}
            </div>

            <div className={styles.block}>
              <label className={styles.blockLabel} htmlFor="explanation-editor-format5">
                <span className={styles.labelIcon}>💡</span>
                Explanation
              </label>
              <div className={styles.editorContainer}>
                <Editor
                  id="explanation-editor-format5"
                  textareaName="explanation-editor-format5"
                  apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                  init={getEditorInit(360)}
                  value={explanation}
                  onEditorChange={(val) => setExplanation(val)}
                />
              </div>
            </div>
          </>
        );

      case 6:
      case 7:
        return (
          <>
            <div className={styles.block}>
              <label className={styles.blockLabel} htmlFor="paragraph-editor-67">
                <span className={styles.labelIcon}>📄</span>
                Paragraph
              </label>
              <div className={styles.editorContainer}>
                <Editor
                  id="paragraph-editor-67"
                  textareaName="paragraph-editor-67"
                  apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                  init={getEditorInit(420)}
                  value={paragraph}
                  onEditorChange={(val) => setParagraph(val)}
                />
              </div>
            </div>

            <div className={styles.block}>
              {renderCasesUI()}
            </div>

            <div className={styles.block}>
              <label className={styles.blockLabel} htmlFor="question-text-editor-67">
                <span className={styles.labelIcon}>❓</span>
                Question {f === 7 ? '(use {"{{dropdown}}"} markers)' : ''}
              </label>
              <div className={styles.editorContainer}>
                <Editor
                  id="question-text-editor-67"
                  textareaName="question-text-editor-67"
                  apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                  init={getEditorInit(480)}
                  value={questionText}
                  onEditorChange={(val) => setQuestionText(val)}
                />
              </div>
            </div>

            <div className={styles.block}>
              {renderChoicesUI()}
            </div>

            <div className={styles.block}>
              <label className={styles.blockLabel} htmlFor="explanation-editor-67">
                <span className={styles.labelIcon}>💡</span>
                Explanation
              </label>
              <div className={styles.editorContainer}>
                <Editor
                  id="explanation-editor-67"
                  textareaName="explanation-editor-67"
                  apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                  init={getEditorInit(360)}
                  value={explanation}
                  onEditorChange={(val) => setExplanation(val)}
                />
              </div>
            </div>
          </>
        );

      case 8:
        return (
          <>
            <div className={styles.block}>
              <label className={styles.blockLabel} htmlFor="question-text-editor-8">
                <span className={styles.labelIcon}>❓</span>
                Question Instructions
              </label>
              <div className={styles.editorContainer}>
                <Editor
                  id="question-text-editor-8"
                  textareaName="question-text-editor-8"
                  apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                  init={getEditorInit(360)}
                  value={questionText}
                  onEditorChange={(val) => setQuestionText(val)}
                />
              </div>
            </div>

            <div className={styles.block}>
              <div className={styles.note}>
                <span className={styles.noteIcon}>💡</span>
                Set "Correct Order" to specify the desired target order (1,2,3...). No specific "correct answer" checkbox is used for Format 8.
              </div>
              {renderChoicesUI()}
            </div>

            <div className={styles.block}>
              <label className={styles.blockLabel} htmlFor="explanation-editor-8">
                <span className={styles.labelIcon}>💡</span>
                Explanation
              </label>
              <div className={styles.editorContainer}>
                <Editor
                  id="explanation-editor-8"
                  textareaName="explanation-editor-8"
                  apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                  init={getEditorInit(420)}
                  value={explanation}
                  onEditorChange={(val) => setExplanation(val)}
                />
              </div>
            </div>
          </>
        );

      case 9:
        // NEW format 9 UI: include paragraph (like format 5), cases, question, lists and explanation
        return (
          <>
            <div className={styles.block}>
              <label className={styles.blockLabel} htmlFor="paragraph-editor-format9">
                <span className={styles.labelIcon}>📄</span>
                Paragraph
              </label>
              <div className={styles.editorContainer}>
                <Editor
                  id="paragraph-editor-format9"
                  textareaName="paragraph-editor-format9"
                  apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                  init={getEditorInit(420)}
                  value={paragraph}
                  onEditorChange={(val) => setParagraph(val)}
                />
              </div>
            </div>

            <div className={styles.block}>
              {renderCasesUI()}
            </div>

            <div className={styles.block}>
              <label className={styles.blockLabel}>
                <span className={styles.labelIcon}>❓</span>
                Question
              </label>
              <div className={styles.editorContainer}>
                <Editor
                  id="question-text-editor-format9"
                  textareaName="question-text-editor-format9"
                  apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                  init={getEditorInit(420)}
                  value={questionText}
                  onEditorChange={(val) => setQuestionText(val)}
                />
              </div>
            </div>

            {/* lists for actions/potentials/parameters */}
            {renderFormat9Lists()}

            <div className={styles.block}>
              <label className={styles.blockLabel} htmlFor="explanation-editor-format9">
                <span className={styles.labelIcon}>💡</span>
                Explanation
              </label>
              <div className={styles.editorContainer}>
                <Editor
                  id="explanation-editor-format9"
                  textareaName="explanation-editor-format9"
                  apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                  init={getEditorInit(320)}
                  value={explanation}
                  onEditorChange={(val) => setExplanation(val)}
                />
              </div>
            </div>
          </>
        );


      default:
        return <div className={styles.unsupported}>🚫 Unsupported format</div>;
    }
  }

  return (
    <div className={styles.container}>
      <Success message={successMessage} />

      <div className={styles.header}>
        <span className={styles.headerIcon}>📤</span>
        <h1 className={styles.headerTitle}>Upload Questions</h1>
      </div>

      <div className={styles.controlsRow}>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel} htmlFor="select-exam">
            <span className={styles.labelIcon}>📚</span>
            Select Exam
          </label>
          <div className={styles.examSelector}>
            <select
              id="select-exam"
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className={styles.select}
            >
              <option value="">-- select exam --</option>
              {exams.map(ex => (
                <option key={ex.id} value={ex.id}>
                  {ex.name} {ex.is_completed ? '✅ (completed)' : ''}
                </option>
              ))}
            </select>
            <button
              type="button"
              className={styles.completeButton}
              onClick={markExamCompleted}
              disabled={!selectedExam || exams.find(x => x.id === Number(selectedExam))?.is_completed || loading}
              title="Mark selected exam as completed"
            >
              <span className={styles.buttonIcon}>✅</span>
              Mark Completed
            </button>
          </div>
        </div>

        <div className={styles.controlGroup}>
          <label className={styles.controlLabel} htmlFor="select-format">
            <span className={styles.labelIcon}>🎯</span>
            Question Format
          </label>
          <select
            id="select-format"
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className={styles.select}
          >
            <option value="1">Format 1 — Q + Choices + Explanation</option>
            <option value="2">Format 2 — Single blank with {"{{answer}}"}</option>
            <option value="3">Format 3 — Multiple blanks with choices</option>
            <option value="4">Format 4 — Q + Image + Choices</option>
            <option value="5">Format 5 — Paragraph + Cases + Question + Headings + Choices</option>
            <option value="6">Format 6 — Paragraph + Cases + Question + Choices</option>
            <option value="7">Format 7 — Paragraph + Cases + Question with {"{{dropdown}}"}</option>
            <option value="8">Format 8 — Drag-order question</option>
            <option value="9">Format 9 — Case(s) + Action(s) / Potential(s) / Parameter(s) + Explanation</option>
          </select>
        </div>

        <div className={styles.controlGroup}>
          <label className={styles.controlLabel} htmlFor="order-input">
            <span className={styles.labelIcon}>🔢</span>
            Question Order
          </label>
          <input
            id="order-input"
            className={styles.orderInput}
            type="number"
            value={order}
            onChange={(e) => setOrder(e.target.value)}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {formatSpecificUI()}

        <div className={styles.submitSection}>
          <button disabled={loading} type="submit" className={styles.submitButton}>
            <span className={styles.buttonIcon}>
              {loading ? '⏳' : '🚀'}
            </span>
            {loading ? 'Uploading...' : 'Upload Question'}
          </button>
        </div>
      </form>
    </div>
  );
}
