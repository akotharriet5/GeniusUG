import { Link } from 'react-router-dom';
import { useFetch } from '../api.js';

function Block({ to, icon, title, value, note, disabled }) {
  const body = (
    <>
      <div className="block-icon">{icon}</div>
      <div className="block-title">{title}</div>
      {value !== undefined && <div className="block-value">{value}</div>}
      {note && <div className="muted">{note}</div>}
      {disabled && <span className="badge">Coming soon</span>}
    </>
  );
  return disabled
    ? <div className="block disabled">{body}</div>
    : <Link to={to} className="block">{body}</Link>;
}

export default function Dashboard() {
  const { data, loading, error } = useFetch('/admin/dashboard');

  return (
    <>
      <h1>Dashboard</h1>
      {error && <div className="error">{error}</div>}

      <div className="blocks">
        <Block to="/classes" icon="🏫" title="Classes" value={loading ? '…' : data?.classes} note="Manage classes, topics & flashcards" />
        <Block to="/subjects" icon="📖" title="Subjects" value={loading ? '…' : data?.subjects} note="Literacy, Maths, ..." />
        <Block disabled icon="🇺🇬" title="Curriculums" note="Uganda primary is active. More later." />
      </div>

      <h2>Summary</h2>
      <div className="stats">
        <div className="card stat"><b>{loading ? '…' : data?.classes}</b><span>Classes</span></div>
        <div className="card stat"><b>{loading ? '…' : data?.subjects}</b><span>Subjects</span></div>
        <div className="card stat"><b>{loading ? '…' : data?.topics}</b><span>Topics</span></div>
        <div className="card stat"><b>{loading ? '…' : data?.flashcards}</b><span>Flashcards</span></div>
        <div className="card stat"><b>{loading ? '…' : data?.flashcards_pending_review}</b><span>Awaiting review</span></div>
      </div>
    </>
  );
}
