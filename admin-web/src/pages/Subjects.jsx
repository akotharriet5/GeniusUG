import { useState } from 'react';
import { api, errMsg, useFetch } from '../api.js';
import Breadcrumbs from '../components/Breadcrumbs.jsx';
import Modal from '../components/Modal.jsx';
import NameDescriptionForm from '../components/NameDescriptionForm.jsx';

export default function Subjects() {
  const { data, loading, error, reload } = useFetch('/admin/subjects');
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState('');

  async function save(values) {
    if (editing === 'new') await api.post('/admin/subjects', values);
    else await api.put(`/admin/subjects/${editing.id}`, values);
    setEditing(null);
    reload();
  }

  async function remove(s) {
    if (!window.confirm(`Delete subject ${s.name}?`)) return;
    try {
      await api.delete(`/admin/subjects/${s.id}`);
      setMsg('');
      reload();
    } catch (e) {
      setMsg(errMsg(e));
    }
  }

  return (
    <>
      <Breadcrumbs items={[{ label: 'Dashboard', to: '/' }, { label: 'Subjects' }]} />
      <div className="page-head">
        <h1>Subjects</h1>
        <button className="btn" onClick={() => setEditing('new')}>+ Add subject</button>
      </div>

      {(error || msg) && <div className="error">{error || msg}</div>}
      {loading ? <p className="muted">Loading…</p> : (
        <table className="table">
          <thead><tr><th>Subject</th><th>Description</th><th>Topics</th><th /></tr></thead>
          <tbody>
            {data?.length === 0 && <tr><td colSpan="4" className="muted">No subjects yet. Add Literacy to begin.</td></tr>}
            {data?.map((s) => (
              <tr key={s.id}>
                <td><b>{s.name}</b></td>
                <td>{s.description}</td>
                <td>{s.topics_count}</td>
                <td className="row-actions">
                  <button className="btn small ghost" onClick={() => setEditing(s)}>Edit</button>
                  <button className="btn small danger" onClick={() => remove(s)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editing && (
        <Modal title={editing === 'new' ? 'Add subject' : `Edit ${editing.name}`} onClose={() => setEditing(null)}>
          <NameDescriptionForm
            initial={editing === 'new' ? null : editing}
            nameLabel="Subject name"
            onSubmit={save}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}
    </>
  );
}
