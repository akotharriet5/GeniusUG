import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, errMsg, useFetch } from '../api.js';
import Breadcrumbs from '../components/Breadcrumbs.jsx';
import Modal from '../components/Modal.jsx';
import NameDescriptionForm from '../components/NameDescriptionForm.jsx';

export default function Classes() {
  const { data, loading, error, reload } = useFetch('/admin/class-levels');
  const [editing, setEditing] = useState(null);   // null | 'new' | class object
  const [msg, setMsg] = useState('');

  async function save(values) {
    if (editing === 'new') await api.post('/admin/class-levels', values);
    else await api.put(`/admin/class-levels/${editing.id}`, values);
    setEditing(null);
    reload();
  }

  async function remove(c) {
    if (!window.confirm(`Delete class ${c.name}?`)) return;
    try {
      await api.delete(`/admin/class-levels/${c.id}`);
      setMsg('');
      reload();
    } catch (e) {
      setMsg(errMsg(e));
    }
  }

  return (
    <>
      <Breadcrumbs items={[{ label: 'Dashboard', to: '/' }, { label: 'Classes' }]} />
      <div className="page-head">
        <h1>Classes</h1>
        <button className="btn" onClick={() => setEditing('new')}>+ Add class</button>
      </div>

      {(error || msg) && <div className="error">{error || msg}</div>}
      {loading ? <p className="muted">Loading…</p> : (
        <table className="table">
          <thead><tr><th>Class</th><th>Description</th><th>Topics</th><th /></tr></thead>
          <tbody>
            {data?.length === 0 && <tr><td colSpan="4" className="muted">No classes yet. Add P1 to begin.</td></tr>}
            {data?.map((c) => (
              <tr key={c.id}>
                <td><Link to={`/classes/${c.id}`}><b>{c.name}</b></Link></td>
                <td>{c.description}</td>
                <td>{c.topics_count}</td>
                <td className="row-actions">
                  <Link className="btn small ghost" to={`/classes/${c.id}`}>Open</Link>
                  <button className="btn small ghost" onClick={() => setEditing(c)}>Edit</button>
                  <button className="btn small danger" onClick={() => remove(c)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editing && (
        <Modal title={editing === 'new' ? 'Add class' : `Edit ${editing.name}`} onClose={() => setEditing(null)}>
          <NameDescriptionForm
            initial={editing === 'new' ? null : editing}
            nameLabel="Class name (e.g. P1)"
            onSubmit={save}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}
    </>
  );
}
