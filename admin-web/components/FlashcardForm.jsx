import { useState } from 'react';
import { api, errMsg } from '../api.js';

export const TYPE_LABELS = { mcq: 'Multiple choice', true_false: 'Boolean', text_input: 'Text input' };

const blankOptions = (type) =>
  type === 'true_false'
    ? [{ text: 'True', is_correct: true }, { text: 'False', is_correct: false }]
    : type === 'text_input'
      ? [{ text: '', is_correct: true }]
      : [{ text: '', is_correct: true }, { text: '', is_correct: false }, { text: '', is_correct: false }];

export default function FlashcardForm({ topicId, initial, onDone, onCancel }) {
  const [type, setType] = useState(initial?.type || 'mcq');
  const [stem, setStem] = useState(initial?.stem || '');
  const [hint, setHint] = useState(initial?.hint || '');
  const [explanation, setExplanation] = useState(initial?.explanation || '');
  const [status, setStatus] = useState(initial?.status || 'approved');
  const [options, setOptions] = useState(initial?.options?.length ? initial.options : blankOptions('mcq'));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function changeType(t) {
    setType(t);
    setOptions(blankOptions(t));
  }

  const setText = (i, text) => setOptions(options.map((o, idx) => (idx === i ? { ...o, text } : o)));
  const setCorrect = (i) => setOptions(options.map((o, idx) => ({ ...o, is_correct: idx === i })));

  async function submit(e) {
    e.preventDefault();
    setError('');
    const cleaned = options.map((o) => ({ ...o, text: o.text.trim() })).filter((o) => o.text !== '');
    if (type === 'mcq' && cleaned.length < 2) return setError('Add at least 2 options.');
    if (type !== 'text_input' && !cleaned.some((o) => o.is_correct)) return setError('Mark the correct answer.');
    if (type === 'text_input' && cleaned.length === 0) return setError('Type the correct answer.');

    const body = {
      stem: stem.trim(), type, status,
      hint: hint.trim() || null, explanation: explanation.trim() || null,
      options: cleaned,
    };
    setBusy(true);
    try {
      if (initial) await api.put(`/admin/questions/${initial.id}`, body);
      else await api.post(`/admin/topics/${topicId}/questions`, body);
      onDone();
    } catch (err) {
      setError(errMsg(err));
      setBusy(false);
    }
  }

  return (
    <form className="form" onSubmit={submit}>
      <label>Question type
        <select value={type} onChange={(e) => changeType(e.target.value)} disabled={!!initial}>
          {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </label>

      <label>Question
        <textarea rows={2} value={stem} onChange={(e) => setStem(e.target.value)} required autoFocus
          placeholder={type === 'mcq' ? 'A ____ is a place where children go to learn' : ''} />
      </label>

      <fieldset>
        <legend>{type === 'text_input' ? 'Accepted answer(s)' : 'Answers (select the correct one)'}</legend>

        {type === 'text_input' ? (
          <>
            {options.map((o, i) => (
              <div className="opt-row" key={i}>
                <input value={o.text} onChange={(e) => setText(i, e.target.value)} placeholder="e.g. school" />
                {options.length > 1 && (
                  <button type="button" className="btn small ghost" onClick={() => setOptions(options.filter((_, x) => x !== i))}>✕</button>
                )}
              </div>
            ))}
            <button type="button" className="btn small ghost" onClick={() => setOptions([...options, { text: '', is_correct: true }])}>
              + Another accepted answer
            </button>
          </>
        ) : (
          options.map((o, i) => (
            <div className="opt-row" key={i}>
              <input type="radio" name="correct" checked={o.is_correct} onChange={() => setCorrect(i)} title="Correct answer" />
              {type === 'true_false'
                ? <span>{o.text}</span>
                : <input value={o.text} onChange={(e) => setText(i, e.target.value)} placeholder={`Option ${i + 1}`} />}
            </div>
          ))
        )}
      </fieldset>

      <label>Hint (optional)<input value={hint} onChange={(e) => setHint(e.target.value)} /></label>
      <label>Shown after answering (optional)
        <input value={explanation} onChange={(e) => setExplanation(e.target.value)} placeholder="Yes! Children learn at school." />
      </label>
      <label>Status
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="approved">Approved (visible to pupils)</option>
          <option value="draft">Draft</option>
          <option value="rejected">Rejected</option>
        </select>
      </label>

      {error && <div className="error">{error}</div>}
      <div className="actions">
        <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>
        <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Submit'}</button>
      </div>
    </form>
  );
}
