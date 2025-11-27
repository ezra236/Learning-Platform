import React, { useEffect, useState } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import Success from './Success';
import styles from './EditQuestion.module.css';

/**
 * Self-contained helpers (so this file works without relying on an external helper file).
 * - fetchCsrf: hits /api/csrf/ to ensure csrftoken cookie is set (your backend function).
 * - getEditorInit: TinyMCE init config.
 */

async function fetchCsrf() {
  await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/csrf/`, {
    credentials: 'include',
  });
}

function getEditorInit(height = 300) {
  return {
    height,
    menubar: true,
    plugins: [
      'advlist',
      'autolink',
      'lists',
      'link',
      'image',
      'charmap',
      'preview',
      'anchor',
      'searchreplace',
      'visualblocks',
      'code',
      'fullscreen',
      'insertdatetime',
      'media',
      'table',
      'help',
      'wordcount'
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

export default function EditQuestion({ questionId, onSaved, examIsCompleted }) {
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState(null);
  const [format, setFormat] = useState('1');
  const [order, setOrder] = useState(0);
  const [questionText, setQuestionText] = useState('');
  const [paragraph, setParagraph] = useState('');
  const [explanation, setExplanation] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [blankAnswer, setBlankAnswer] = useState('');
  const [choices, setChoices] = useState([]);
  const [cases, setCases] = useState([]);
  const [headings, setHeadings] = useState(['', '', '']);
  // --- new lists for format 9 ---
  const [actions, setActions] = useState([]);
  const [potentials, setPotentials] = useState([]);
  const [parameters, setParameters] = useState([]);
  // --- end new ---
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (questionId) loadQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionId]);

  async function loadQuestion() {
    setLoading(true);
    const resp = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/nclex/questions/${questionId}/`, {
      credentials: 'include',
    });
    const data = await resp.json();
    setQuestion(data);
    setFormat(String(data.format));
    setOrder(data.order || 0);
    setQuestionText(data.question_text || '');
    setParagraph(data.paragraph || '');
    setExplanation(data.explanation || '');
    setImageUrl(data.image_url || '');
    setBlankAnswer(data.blank_answer || '');
    setChoices((data.choices || []).map(c => ({
      id: c.id,
      label: c.label || '',
      text: c.text || '',
      is_correct: !!c.is_correct,
      correct_order: c.correct_order || null,
      display_order: c.display_order || 0,
    })));
    setCases((data.cases || []).map(c => ({ id: c.id, heading: c.heading || '', case_text: c.case_text || '' })));
    setHeadings([data.heading1 || '', data.heading2 || '', data.heading3 || '']);

    // load format 9 arrays if present
    setActions((data.actions || []).map(a => ({ id: a.id, text: a.text || '', is_correct: !!a.is_correct, display_order: a.display_order || 0 })));
    setPotentials((data.potentials || []).map(p => ({ id: p.id, text: p.text || '', is_correct: !!p.is_correct, display_order: p.display_order || 0 })));
    setParameters((data.parameters || []).map(p => ({ id: p.id, text: p.text || '', is_correct: !!p.is_correct, display_order: p.display_order || 0 })));

    setLoading(false);
  }

  function addChoice() {
    setChoices(prev => [...prev, { label: String.fromCharCode(65 + prev.length), text: '', is_correct: false, correct_order: null }]);
  }
  function removeChoice(idx) {
    setChoices(prev => prev.filter((_, i) => i !== idx));
  }
  function updateChoice(idx, key, val) {
    setChoices(prev => prev.map((c, i) => (i === idx ? { ...c, [key]: val } : c)));
  }

  function addCase() {
    setCases(prev => [...prev, { heading: '', case_text: '' }]);
  }
  function removeCase(idx) {
    setCases(prev => prev.filter((_, i) => i !== idx));
  }
  function updateCase(idx, key, val) {
    setCases(prev => prev.map((c, i) => (i === idx ? { ...c, [key]: val } : c)));
  }

  // --- new format 9 helpers ---
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

  async function uploadImage(file) {
    const form = new FormData();
    form.append('file', file);
    await fetchCsrf();
    const csrftoken = (document.cookie.match(/csrftoken=([^;]+)/) || [])[1] || '';
    const resp = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/nclex/upload-image/`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'X-CSRFToken': csrftoken },
      body: form,
    });
    const json = await resp.json();
    if (resp.ok) setImageUrl(json.url);
    else alert('❌ ' + JSON.stringify(json));
  }

  async function handleSave(e) {
    e?.preventDefault?.();
    if (!question) return;

    setLoading(true);
    await fetchCsrf();
    const csrftoken = (document.cookie.match(/csrftoken=([^;]+)/) || [])[1] || '';

    const payload = {
      format: Number(format),
      order: Number(order || 0),
      question_text: questionText,
      paragraph,
      explanation,
      image_url: imageUrl,
      blank_answer: blankAnswer,
      heading1: format === '5' ? headings[0] || '' : '',
      heading2: format === '5' ? headings[1] || '' : '',
      heading3: format === '5' ? headings[2] || '' : '',
      choices: choices.map((c, idx) => ({
        id: c.id,
        label: c.label || `Choice ${idx + 1}`,
        text: c.text || '',
        is_correct: !!c.is_correct,
        correct_order: c.correct_order ? Number(c.correct_order) : null,
        display_order: c.display_order || (idx + 1),
      })),
      cases: cases.map(c => ({
        id: c.id,
        heading: c.heading,
        case_text: c.case_text,
      })),
      // format 9 payloads
      actions: actions.map((a, idx) => ({ id: a.id, text: a.text || '', is_correct: !!a.is_correct, display_order: a.display_order || (idx + 1) })),
      potentials: potentials.map((p, idx) => ({ id: p.id, text: p.text || '', is_correct: !!p.is_correct, display_order: p.display_order || (idx + 1) })),
      parameters: parameters.map((p, idx) => ({ id: p.id, text: p.text || '', is_correct: !!p.is_correct, display_order: p.display_order || (idx + 1) })),
    };

    const resp = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/nclex/questions/${questionId}/`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrftoken,
      },
      body: JSON.stringify(payload),
    });
    const json = await resp.json();
    setLoading(false);
    if (resp.ok) {
      setSuccessMessage('✅ Question updated successfully');
      if (onSaved) onSaved(json);
      setTimeout(() => setSuccessMessage(''), 4000);
    } else {
      alert('❌ ' + JSON.stringify(json));
    }
  }

  if (!questionId) return <div className={styles.placeholder}>Select a question to edit.</div>;
  if (loading && !question) return <div className={styles.loading}>🔄 Loading question...</div>;

  const showCorrectOrder = Number(format) === 8;
  const showCorrectCheckbox = Number(format) !== 8;

  return (
    <div className={styles.container}>
      <Success message={successMessage} />

      {examIsCompleted && (
        <div className={styles.warningBanner}>
          <span className={styles.warningIcon}>⚠️</span>
          <div>
            <strong>Note:</strong> This exam is marked completed. You <em>can</em> edit existing questions but you cannot add new questions to this exam.
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className={styles.form}>
        <div className={styles.controlRow}>
          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="edit-format-select">
              <span className={styles.labelIcon}>🎯</span>
              Format
            </label>
            <select id="edit-format-select" className={styles.select} value={format} onChange={(e) => setFormat(e.target.value)}>
              <option value="1">📝 Format 1</option>
              <option value="2">📝 Format 2</option>
              <option value="3">📝 Format 3</option>
              <option value="4">📝 Format 4</option>
              <option value="5">📝 Format 5</option>
              <option value="6">📝 Format 6</option>
              <option value="7">📝 Format 7</option>
              <option value="8">📝 Format 8</option>
              <option value="9">📝 Format 9</option>
            </select>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="edit-order-input">
              <span className={styles.labelIcon}>🔢</span>
              Order
            </label>
            <input id="edit-order-input" className={styles.smallInput} type="number" value={order} onChange={(e) => setOrder(e.target.value)} />
          </div>
        </div>

        {(['1','2','3','4','7','8'].includes(format) || format === '9') && (
          <div className={styles.editorGroup}>
            <label className={styles.label} htmlFor="edit-question-text-editor">
              <span className={styles.labelIcon}>❓</span>
              Question Text
            </label>
            <Editor
              id="edit-question-text-editor"
              textareaName="edit-question-text-editor"
              apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
              init={getEditorInit(420)}
              value={questionText}
              onEditorChange={(val) => setQuestionText(val)}
            />
          </div>
        )}

        {/* ADDED: show cases + question area for 5,6,7 AND 9 (paragraph included for 5/6/7/9) */}
        {(['5','6','7','9'].includes(format)) && (
          <>
            {/* paragraph for formats 5/6/7 and 9 */}
            {(['5','6','7','9'].includes(format)) && (
              <div className={styles.editorGroup}>
                <label className={styles.label} htmlFor="edit-paragraph-editor">
                  <span className={styles.labelIcon}>📄</span>
                  Paragraph
                </label>
                <Editor
                  id="edit-paragraph-editor"
                  textareaName="edit-paragraph-editor"
                  apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                  init={getEditorInit(420)}
                  value={paragraph}
                  onEditorChange={(val) => setParagraph(val)}
                />
              </div>
            )}

            <div className={styles.casesSection}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionIcon}>📂</span>
                <strong>Cases</strong>
                <button type="button" className={styles.addButton} onClick={addCase}>
                  ➕ Add Case
                </button>
              </div>

              <div className={styles.casesList}>
                {cases.map((c, idx) => (
                  <div key={idx} className={styles.caseItem}>
                    <div className={styles.caseHeader}>
                      <h4 className={styles.caseTitle}>Case {idx + 1}</h4>
                      <button type="button" className={styles.removeButton} onClick={() => removeCase(idx)}>
                        🗑️ Remove
                      </button>
                    </div>

                    <div className={styles.editorContainer}>
                      <label htmlFor={`case-heading-${idx}`} className={styles.label}>Case heading</label>
                      <Editor
                        id={`case-heading-${idx}`}
                        textareaName={`case-heading-${idx}`}
                        apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                        init={getEditorInit(220)}
                        value={c.heading}
                        onEditorChange={(val) => updateCase(idx, 'heading', val)}
                      />
                    </div>

                    <div className={styles.editorContainer}>
                      <label htmlFor={`case-text-${idx}`} className={styles.label}>Case text</label>
                      <Editor
                        id={`case-text-${idx}`}
                        textareaName={`case-text-${idx}`}
                        apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                        init={getEditorInit(300)}
                        value={c.case_text}
                        onEditorChange={(val) => updateCase(idx, 'case_text', val)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Question editor (for 5/6/7 we already render paragraph above; for 9 this becomes the right-side question area) */}
            <div className={styles.block}>
              <label className={styles.blockLabel} htmlFor={`edit-question-text-format-${format}`}>
                <span className={styles.labelIcon}>❓</span>
                Question
              </label>
              <div className={styles.editorContainer}>
                <Editor
                  id={`edit-question-text-format-${format}`}
                  textareaName={`edit-question-text-format-${format}`}
                  apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                  init={getEditorInit(480)}
                  value={questionText}
                  onEditorChange={(val) => setQuestionText(val)}
                />
              </div>
            </div>
          </>
        )}

        {format === '4' && (
          <div className={styles.imageSection}>
            <label className={styles.label} htmlFor="edit-image-file">
              <span className={styles.labelIcon}>🖼️</span>
              Image (optional)
            </label>
            <input
              id="edit-image-file"
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
                <span>📎 Uploaded: </span>
                <a href={imageUrl} target="_blank" rel="noreferrer">{imageUrl}</a>
              </div>
            )}
          </div>
        )}

        {/* REMOVED 9 FROM CHOICES: choices are not part of format 9 */}
        {(['1','3','4','5','6','7','8'].includes(format)) && (
          <div className={styles.choicesSection}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon}>🔘</span>
              <strong>Choices</strong>
              <button
                type="button"
                className={styles.addButton}
                onClick={addChoice}
                disabled={examIsCompleted && !question?.id}
              >
                ➕ Add Choice
              </button>
            </div>

            <div className={styles.choicesList}>
              {choices.map((c, idx) => (
                <div key={idx} className={styles.choiceItem}>
                  <div className={styles.choiceHeader}>
                    <span className={styles.choiceLabel}>
                      {c.label || String.fromCharCode(65 + idx)}
                    </span>
                    <button
                      type="button"
                      className={styles.removeButton}
                      onClick={() => removeChoice(idx)}
                    >
                      🗑️
                    </button>
                  </div>

                  <div className={styles.editorContainer}>
                    <label htmlFor={`edit-choice-text-${idx}`} className={styles.label}>Choice {idx + 1} text</label>
                    <Editor
                      id={`edit-choice-text-${idx}`}
                      textareaName={`edit-choice-text-${idx}`}
                      apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                      init={getEditorInit(320)}
                      value={c.text}
                      onEditorChange={(val) => updateChoice(idx, 'text', val)}
                    />
                  </div>

                  <div className={styles.choiceControls}>
                    {showCorrectCheckbox && (
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={!!c.is_correct}
                          onChange={(e) => updateChoice(idx, 'is_correct', e.target.checked)}
                        />
                        <span className={styles.checkboxText}>✅ Correct</span>
                      </label>
                    )}

                    {showCorrectOrder && (
                      <label className={styles.orderLabel}>
                        🎯 Order:
                        <input
                          type="number"
                          className={styles.tinyInput}
                          min={1}
                          value={c.correct_order || ''}
                          onChange={(e) => updateChoice(idx, 'correct_order', e.target.value ? Number(e.target.value) : null)}
                        />
                      </label>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {format === '2' && (
          <div className={styles.editorGroup}>
            <label className={styles.label} htmlFor="edit-blank-answer">
              <span className={styles.labelIcon}>📝</span>
              Correct Answer for Blank
            </label>
            <Editor
              id="edit-blank-answer"
              textareaName="edit-blank-answer"
              apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
              init={getEditorInit(300)}
              value={blankAnswer}
              onEditorChange={(val) => setBlankAnswer(val)}
            />
          </div>
        )}

        <div className={styles.editorGroup}>
          <label className={styles.label} htmlFor="edit-explanation-editor">
            <span className={styles.labelIcon}>💡</span>
            Explanation
          </label>
          <Editor
            id="edit-explanation-editor"
            textareaName="edit-explanation-editor"
            apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
            init={getEditorInit(320)}
            value={explanation}
            onEditorChange={(val) => setExplanation(val)}
          />
        </div>

        {/* Headings inputs for format 5 */}
        {format === '5' && (
          <div className={styles.block}>
            <label className={styles.blockLabel}>
              <span className={styles.labelIcon}>📑</span>
              Headings
            </label>
            <div className={styles.headingsGrid}>
              <div className={styles.headingEditor}>
                <label htmlFor="edit-heading-1-editor" className={styles.label}>Heading 1</label>
                <Editor
                  id="edit-heading-1-editor"
                  textareaName="edit-heading-1-editor"
                  apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                  init={getEditorInit(360)}
                  value={headings[0]}
                  onEditorChange={(val) => setHeadings([val, headings[1], headings[2]])}
                />
              </div>
              <div className={styles.headingEditor}>
                <label htmlFor="edit-heading-2-editor" className={styles.label}>Heading 2</label>
                <Editor
                  id="edit-heading-2-editor"
                  textareaName="edit-heading-2-editor"
                  apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                  init={getEditorInit(360)}
                  value={headings[1]}
                  onEditorChange={(val) => setHeadings([headings[0], val, headings[2]])}
                />
              </div>
              <div className={styles.headingEditor}>
                <label htmlFor="edit-heading-3-editor" className={styles.label}>Heading 3</label>
                <Editor
                  id="edit-heading-3-editor"
                  textareaName="edit-heading-3-editor"
                  apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                  init={getEditorInit(360)}
                  value={headings[2]}
                  onEditorChange={(val) => setHeadings([headings[0], headings[1], val])}
                />
              </div>
            </div>
          </div>
        )}

        {/* Format 9 editing UI: lists for actions/potentials/parameters (no paragraph required) */}
        {format === '9' && (
          <>
            <div className={styles.block}>
              <label className={styles.blockLabel}><span className={styles.labelIcon}>⚡</span> Action(s) to Take</label>
              <div className={styles.listGrid}>
                {actions.map((a, idx) => (
                  <div key={idx} className={styles.smallItem}>
                    <div className={styles.smallHeader}>
                      <strong>Action {idx + 1}</strong>
                      <button type="button" className={styles.removeButton} onClick={() => removeAction(idx)}>🗑️</button>
                    </div>
                    <div className={styles.editorContainer}>
                      <label className={styles.label} htmlFor={`edit-action-text-${idx}`}>Action text</label>
                      <Editor
                        id={`edit-action-text-${idx}`}
                        textareaName={`edit-action-text-${idx}`}
                        apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                        init={getEditorInit(220)}
                        value={a.text}
                        onEditorChange={(val) => updateAction(idx, 'text', val)}
                      />
                    </div>
                    <label className={styles.checkboxLabel}>
                      <input type="checkbox" checked={!!a.is_correct} onChange={(e) => updateAction(idx, 'is_correct', e.target.checked)} />
                      <span className={styles.checkboxText}>Mark as correct</span>
                    </label>
                  </div>
                ))}
              </div>
              <button type="button" className={styles.addButton} onClick={addAction}>➕ Add Action</button>
            </div>

            <div className={styles.block}>
              <label className={styles.blockLabel}><span className={styles.labelIcon}>🩺</span> Potential Condition(s)</label>
              <div className={styles.listGrid}>
                {potentials.map((p, idx) => (
                  <div key={idx} className={styles.smallItem}>
                    <div className={styles.smallHeader}>
                      <strong>Potential {idx + 1}</strong>
                      <button type="button" className={styles.removeButton} onClick={() => removePotential(idx)}>🗑️</button>
                    </div>
                    <div className={styles.editorContainer}>
                      <label className={styles.label} htmlFor={`edit-potential-text-${idx}`}>Potential text</label>
                      <Editor
                        id={`edit-potential-text-${idx}`}
                        textareaName={`edit-potential-text-${idx}`}
                        apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                        init={getEditorInit(220)}
                        value={p.text}
                        onEditorChange={(val) => updatePotential(idx, 'text', val)}
                      />
                    </div>
                    <label className={styles.checkboxLabel}>
                      <input type="checkbox" checked={!!p.is_correct} onChange={(e) => updatePotential(idx, 'is_correct', e.target.checked)} />
                      <span className={styles.checkboxText}>Mark as correct</span>
                    </label>
                  </div>
                ))}
              </div>
              <button type="button" className={styles.addButton} onClick={addPotential}>➕ Add Potential</button>
            </div>

            <div className={styles.block}>
              <label className={styles.blockLabel}><span className={styles.labelIcon}>📈</span> Parameter(s) to Monitor</label>
              <div className={styles.listGrid}>
                {parameters.map((p, idx) => (
                  <div key={idx} className={styles.smallItem}>
                    <div className={styles.smallHeader}>
                      <strong>Parameter {idx + 1}</strong>
                      <button type="button" className={styles.removeButton} onClick={() => removeParameter(idx)}>🗑️</button>
                    </div>
                    <div className={styles.editorContainer}>
                      <label className={styles.label} htmlFor={`edit-parameter-text-${idx}`}>Parameter text</label>
                      <Editor
                        id={`edit-parameter-text-${idx}`}
                        textareaName={`edit-parameter-text-${idx}`}
                        apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                        init={getEditorInit(220)}
                        value={p.text}
                        onEditorChange={(val) => updateParameter(idx, 'text', val)}
                      />
                    </div>
                    <label className={styles.checkboxLabel}>
                      <input type="checkbox" checked={!!p.is_correct} onChange={(e) => updateParameter(idx, 'is_correct', e.target.checked)} />
                      <span className={styles.checkboxText}>Mark as correct</span>
                    </label>
                  </div>
                ))}
              </div>
              <button type="button" className={styles.addButton} onClick={addParameter}>➕ Add Parameter</button>
            </div>
          </>
        )}

        <div className={styles.saveSection}>
          <button className={styles.saveButton} type="submit" disabled={loading}>
            {loading ? (
              <>
                <span className={styles.spinner}></span>
                Saving...
              </>
            ) : (
              <>
                💾 Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
