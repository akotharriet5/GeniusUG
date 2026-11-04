import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, errMsg, useFetch } from '../api.js';
import Breadcrumbs from '../components/Breadcrumbs.jsx';
import Modal from '../components/Modal.jsx';

function TopicForm({ classId, initial, subjects, onDone, onCancel }) {
  const [name, setName] = useState(initial?.name || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [subjectId, setSubjectId] = useState(initial?.subject_id || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const body = { name: name.trim(), description: description.trim() || null, subject_id: Number(subjectId) };
    try {
      if (initial) await api.put(`/admin/topics/${initial.id}`, body);
      else await api.post(`/admin/class-levels/${classId}/topics`, body);
      onDone();
    } catch (err) {
      setError(errMsg(err));
      setBusy(false);
    }
  }

  return (
    <form className="form" onSubmit={submit}>
      <label>Subject
        <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} required>
          <option value="">Choose a subject…</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </label>
      <label>Topic name<input value={name} onChange={(e) => setName(e.target.value)} required autoFocus /></label>
      <label>Description<textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} /></label>
      {subjects.length === 0 && <div className="error">Add a subject first (Dashboard → Subjects).</div>}
      {error && <div className="error">{error}</div>}
      <div className="actions">
        <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>
        <button className="btn" disabled={busy || subjects.length === 0}>{busy ? 'Saving…' : 'Submit'}</button>
      </div>
    </form>
  );
}

export default function ClassDetail() {
  const { classId } = useParams();
  const cls = useFetch(`/admin/class-levels/${classId}`);
  const topics = useFetch(`/admin/class-levels/${classId}/topics`);
  const subjects = useFetch('/admin/subjects');
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState('');

  async function remove(t) {
    if (!window.confirm(`Delete topic "${t.name}"?`)) return;
    try {
      await api.delete(`/admin/topics/${t.id}`);
      setMsg('');
      topics.reload();
    } catch (e) {
      setMsg(errMsg(e));
    }
  }

  return (
    <>
      <Breadcrumbs items={[{ label: 'Dashboard', to: '/' }, { label: 'Classes', to: '/classes' }, { label: cls.data?.name || '…' }]} />
      <div className="page-head">
        <h1>{cls.data?.name} topics</h1>
        <button className="btn" onClick={() => setEditing('new')}>+ Add topic</button>
      </div>
      {cls.data?.description && <p className="muted">{cls.data.description}</p>}

      {(topics.error || msg) && <div className="error">{topics.error || msg}</div>}
      {topics.loading ? <p className="muted">Loading…</p> : (
        <table className="table">
          <thead><tr><th>Topic</th><th>Subject</th><th>Flashcards</th><th /></tr></thead>
          <tbody>
            {topics.data?.length === 0 && <tr><td colSpan="4" className="muted">No topics yet for this class.</td></tr>}
            {topics.data?.map((t) => (
              <tr key={t.id}>
                <td><Link to={`/topics/${t.id}`}><b>{t.name}</b></Link></td>
                <td>{t.subject?.name}</td>
                <td>{t.questions_count}</td>
                <td className="row-actions">
                  <Link className="btn small ghost" to={`/topics/${t.id}`}>Open</Link>
                  <button className="btn small ghost" onClick={() => setEditing(t)}>Edit</button>
                  <button className="btn small danger" onClick={() => remove(t)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editing && (
        <Modal title={editing === 'new' ? 'Add topic' : `Edit ${editing.name}`} onClose={() => setEditing(null)}>
          <TopicForm
            classId={classId}
            initial={editing === 'new' ? null : editing}
            subjects={subjects.data || []}
            onCancel={() => setEditing(null)}
            onDone={() => { setEditing(null); topics.reload(); }}
          />
        </Modal>
      )}
    </>
  );
}
