import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { api, errMsg } from '../api.js';

export default function Login() {
  const { token, login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    api.get('/setup-status').then((r) => setNeedsSetup(!!r.data.needs_setup)).catch(() => {});
  }, []);

  if (token) return <Navigate to="/" replace />;

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(email, password);
      nav('/');
    } catch (err) {
      setError(err.response ? errMsg(err) : err.message);
      setBusy(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="card form" onSubmit={submit}>
        <h2>📚 Learning Admin</h2>
        <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus /></label>
        <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
        {error && <div className="error">{error}</div>}
        <button className="btn" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        {needsSetup && (
          <p className="muted">First time here? <Link to="/setup">Create the first admin account</Link></p>
        )}
      </form>
    </div>
  );
}
