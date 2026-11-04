import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

export default function Layout() {
  const { user, logout } = useAuth();
  return (
    <div className="shell">
      <header className="topbar">
        <Link to="/" className="brand">📚 Learning Admin</Link>
        <nav>
          <Link to="/classes">Classes</Link>
          <Link to="/subjects">Subjects</Link>
        </nav>
        <div className="spacer" />
        <span className="muted">{user?.name}</span>
        <button className="btn ghost" onClick={logout}>Log out</button>
      </header>
      <main className="content"><Outlet /></main>
    </div>
  );
}
