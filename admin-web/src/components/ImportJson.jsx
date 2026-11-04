import { useState } from 'react';
import { api, errMsg } from '../api.js';

const EXAMPLE = `[
  {"question": "A ____ is a place where children go to learn",
   "type": "multiple_choice",
   "options": ["a school", "a community", "a home"],
   "answer": "a school"},
  {"question": "Children go to school to learn.", "type": "boolean", "answer": true}
]`;

export default function ImportJson({ topicId, onDone, onCancel }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setError('');
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return setError('That is not valid JSON.');
    }
    const questions = Array.isArray(parsed) ? parsed : parsed.questions;
    if (!Array.isArray(questions)) return setError('Expected a list of questions (or {"questions": [...]}).');

    setBusy(true);
    try {
      const { data } = await api.post(`/admin/topics/${topicId}/questions/import`, { questions });
      setResult(data);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <div className="form">
        <p><b>{result.created}</b> flashcard(s) imported as drafts. Review and approve them below.</p>
        {result.skipped.length > 0 && (
          <>
            <p><b>{result.skipped.length}</b> skipped:</p>
            <ul>{result.skipped.map((s) => <li key={s.index}>#{s.index + 1}: {s.reason}</li>)}</ul>
          </>
        )}
        <div className="actions"><button className="btn" onClick={onDone}>Done</button></div>
      </div>
    );
  }

  return (
    <form className="form" onSubmit={submit}>
      <p className="muted">Paste the JSON from the playground. Imported cards are saved as drafts.</p>
      <textarea rows={12} value={text} onChange={(e) => setText(e.target.value)} placeholder={EXAMPLE} required />
      {error && <div className="error">{error}</div>}
      <div className="actions">
        <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>
        <button className="btn" disabled={busy}>{busy ? 'Importing…' : 'Import'}</button>
      </div>
    </form>
  );
}
