import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AUTH_EVENT, authRequest, loadCurrentUser, signOut } from '../services/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    loadCurrentUser().then((current) => { if (alive) setUser(current); }).finally(() => { if (alive) setLoading(false); });
    const onAuth = (event) => setUser(event.detail || null);
    const onStorage = (event) => { if (event.key === 'filewiz:token') loadCurrentUser().then(setUser); };
    window.addEventListener(AUTH_EVENT, onAuth);
    window.addEventListener('storage', onStorage);
    return () => { alive = false; window.removeEventListener(AUTH_EVENT, onAuth); window.removeEventListener('storage', onStorage); };
  }, []);

  const updateProfile = useCallback(async (name) => (await authRequest('/profile', { method: 'PUT', body: JSON.stringify({ name }) })).user, []);
  const logout = useCallback(() => signOut(), []);
  return <AuthContext.Provider value={{ user, loading, updateProfile, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }
