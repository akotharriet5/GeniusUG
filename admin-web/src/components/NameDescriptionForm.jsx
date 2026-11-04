import { useState } from 'react';
import { errMsg } from '../api.js';

/** Small reusable form for master tables (class, subject): name + description. */
export default function NameDescriptionForm({ initial, nameLabel, onSubmit, onCancel }) {
  const [name, setName] = useState(initial?.name || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onSubmit({ name: name.trim(), description: description.trim() || null });
    } catch (err) {
      setError(errMsg(err));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="form">
      <label>{nameLabel}
        <input value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
      </label>
      <label>Description
        <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>
      {error && <div className="error">{error}</div>}
      <div className="actions">
        <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>
        <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Submit'}</button>
      </div>
    </form>
  );
}
