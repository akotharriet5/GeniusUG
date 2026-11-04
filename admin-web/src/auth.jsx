import { createContext, useContext, useState } from 'react';
import { api } from './api.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('admin_token'));
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('admin_user')); } catch { return null; }
  });

  function startSession(data) {
    if (data.user.role !== 'admin') {
      throw new Error('This panel is for admins only.');
    }
    localStorage.setItem('admin_token', data.token);
    localStorage.setItem('admin_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  }

  async function login(email, password) {
    const { data } = await api.post('/login', { email, password });
    startSession(data);
  }

  /** First-time admin creation (only works while no admin exists). */
  async function setupAdmin(payload) {
    const { data } = await api.post('/setup-admin', payload);
    startSession(data);
  }

  async function logout() {
    try { await api.post('/admin/logout'); } catch { /* token may already be invalid */ }
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setToken(null);
    setUser(null);
  }

  return <AuthContext.Provider value={{ token, user, login, setupAdmin, logout }}>{children}</AuthContext.Provider>;
}
