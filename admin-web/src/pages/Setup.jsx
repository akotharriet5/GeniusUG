import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { api, errMsg } from '../api.js';

/** Create the first admin. The server refuses this once any admin exists. */
export default function Setup() {
  const { token, setupAdmin } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '' });
  const [needsSetup, setNeedsSetup] = useState(null);   // null = checking
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/setup-status').then((r) => setNeedsSetup(!!r.data.needs_setup)).catch((e) => { setNeedsSetup(false); setError(errMsg(e)); });
  }, []);

  if (token) return <Navigate to="/" replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (form.password !== form.password_confirmation) return setError('Passwords do not match.');
    setBusy(true);
    try {
      await setupAdmin(form);
      nav('/');
    } catch (err) {
      setError(err.response ? errMsg(err) : err.message);
      setBusy(false);
    }
  }

  if (needsSetup === null) return <div className="login-wrap"><p className="muted">Checking…</p></div>;

  if (!needsSetup) {
    return (
      <div className="login-wrap">
        <div className="card form">
          <h2>Setup already done</h2>
          <p className="muted">An admin account already exists. Ask an existing admin for access.</p>
          {error && <div className="error">{error}</div>}
          <Link className="btn" to="/login">Go to sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="login-wrap">
      <form className="card form" onSubmit={submit}>
        <h2>Create first admin</h2>
        <label>Full name<input value={form.name} onChange={set('name')} required autoFocus /></label>
        <label>Email<input type="email" value={form.email} onChange={set('email')} required /></label>
        <label>Password (min 8 characters)<input type="password" value={form.password} onChange={set('password')} minLength={8} required /></label>
        <label>Confirm password<input type="password" value={form.password_confirmation} onChange={set('password_confirmation')} required /></label>
        {error && <div className="error">{error}</div>}
        <button className="btn" disabled={busy}>{busy ? 'Creating…' : 'Create admin account'}</button>
        <Link to="/login" className="muted">Back to sign in</Link>
      </form>
    </div>
  );
}
