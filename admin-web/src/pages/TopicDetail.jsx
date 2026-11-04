import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, errMsg, useFetch } from '../api.js';
import Breadcrumbs from '../components/Breadcrumbs.jsx';
import FlashcardForm, { TYPE_LABELS } from '../components/FlashcardForm.jsx';
import ImportJson from '../components/ImportJson.jsx';
import Modal from '../components/Modal.jsx';

export default function TopicDetail() {
  const { topicId } = useParams();
  const topic = useFetch(`/admin/topics/${topicId}`);
  const cards = useFetch(`/admin/topics/${topicId}/questions`);
  const [editing, setEditing] = useState(null);     // null | 'new' | card
  const [importing, setImporting] = useState(false);
  const [msg, setMsg] = useState('');

  async function remove(c) {
    if (!window.confirm(`Delete flashcard #${c.id}?`)) return;
    try {
      await api.delete(`/admin/questions/${c.id}`);
      cards.reload();
    } catch (e) {
      setMsg(errMsg(e));
    }
  }

  async function approve(c) {
    try {
      await api.put(`/admin/questions/${c.id}`, { ...c, status: 'approved' });
      cards.reload();
    } catch (e) {
      setMsg(errMsg(e));
    }
  }

  const t = topic.data;
  return (
    <>
      <Breadcrumbs items={[
        { label: 'Dashboard', to: '/' },
        { label: 'Classes', to: '/classes' },
        { label: t?.class_level?.name || '…', to: t ? `/classes/${t.class_level_id}` : undefined },
        { label: t?.name || '…' },
      ]} />
      <div className="page-head">
        <h1>{t?.name} <span className="muted">· {t?.subject?.name}</span></h1>
        <div className="row-actions">
          <button className="btn ghost" disabled title="Coming soon: AI generation from uploaded notes">⬆ Upload document (soon)</button>
          <button className="btn ghost" onClick={() => setImporting(true)}>Import JSON</button>
          <button className="btn" onClick={() => setEditing('new')}>+ Add flashcard</button>
        </div>
      </div>

      {(cards.error || msg) && <div className="error">{cards.error || msg}</div>}
      {cards.loading ? <p className="muted">Loading…</p> : (
        <table className="table">
          <thead><tr><th>ID</th><th>Question</th><th>Type</th><th>Correct answer</th><th>Status</th><th /></tr></thead>
          <tbody>
            {cards.data?.length === 0 && <tr><td colSpan="6" className="muted">No flashcards yet. Add one or import JSON.</td></tr>}
            {cards.data?.map((c) => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td>{c.stem}</td>
                <td>{TYPE_LABELS[c.type] || c.type}</td>
                <td><b>{c.correct_answer}</b></td>
                <td><span className={`pill ${c.status}`}>{c.status}</span></td>
                <td className="row-actions">
                  {c.status === 'draft' && <button className="btn small" onClick={() => approve(c)}>Approve</button>}
                  <button className="btn small ghost" onClick={() => setEditing(c)}>Edit</button>
                  <button className="btn small danger" onClick={() => remove(c)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editing && (
        <Modal wide title={editing === 'new' ? 'Add flashcard' : `Edit flashcard #${editing.id}`} onClose={() => setEditing(null)}>
          <FlashcardForm
            topicId={topicId}
            initial={editing === 'new' ? null : editing}
            onCancel={() => setEditing(null)}
            onDone={() => { setEditing(null); cards.reload(); }}
          />
        </Modal>
      )}

      {importing && (
        <Modal wide title="Import flashcards from JSON" onClose={() => setImporting(false)}>
          <ImportJson topicId={topicId} onCancel={() => setImporting(false)} onDone={() => { setImporting(false); cards.reload(); }} />
        </Modal>
      )}
    </>
  );
}
