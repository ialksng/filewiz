import apiBase from './apiBase';

const TOKEN_KEY = 'filewiz:token';
const AUTH_EVENT = 'filewiz:auth-changed';

export const getAuthToken = () => {
  try { return window.localStorage.getItem(TOKEN_KEY); } catch { return null; }
};

function announce(user = null) {
  window.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail: user }));
}

export function clearAuth() {
  try { window.localStorage.removeItem(TOKEN_KEY); } catch { /* Storage can be disabled. */ }
  announce(null);
}

export async function authRequest(path, options = {}) {
  const token = getAuthToken();
  let response;
  try {
    response = await fetch(`${apiBase}/auth${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
    });
  } catch (error) {
    if (error instanceof TypeError) throw new Error('Could not reach the FileWiz API. Check that the API is online and its CORS settings allow this site.', { cause: error });
    throw error;
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'Account service is unavailable.');
  if (body.token) {
    try { window.localStorage.setItem(TOKEN_KEY, body.token); } catch { throw new Error('Browser storage is unavailable; sign-in cannot be saved.'); }
  }
  if (body.user) announce(body.user);
  return body;
}

export async function loadCurrentUser() {
  if (!getAuthToken()) return null;
  try { return (await authRequest('/me')).user; }
  catch { clearAuth(); return null; }
}

export async function signOut() {
  clearAuth();
}

export { AUTH_EVENT };
