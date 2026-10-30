import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useSeoMetadata from '../services/useSeoMetadata';
import { authRequest } from '../services/auth';
import GoogleSignInButton from '../components/GoogleSignInButton';

export default function Login() {
  useSeoMetadata({ title: 'Sign in · FileWiz', description: 'Sign in to your FileWiz account.', robots: 'noindex, nofollow' });
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  const navigate = useNavigate(); const location = useLocation();
  const notice = location.state?.message || '';
  const submit = async (event) => {
    event.preventDefault(); setLoading(true); setError('');
    try { await authRequest('/login', { method: 'POST', body: JSON.stringify({ email, password }) }); navigate(location.state?.from || '/account', { replace: true }); }
    catch (cause) { setError(cause.message); }
    finally { setLoading(false); }
  };
  const signInWithGoogle = async (credential) => {
    setLoading(true); setError('');
    try { await authRequest('/google', { method: 'POST', body: JSON.stringify({ credential }) }); navigate(location.state?.from || '/account', { replace: true }); }
    catch (cause) { setError(cause.message); }
    finally { setLoading(false); }
  };
  return <div className="min-h-screen flex items-center justify-center bg-bg-gray p-6"><div className="card w-full max-w-md p-8">
    <h1 className="mb-2 text-center text-3xl font-heading font-bold text-navy-dark">Sign In</h1><p className="mb-8 text-center text-gray-500">Enter your email and password to continue.</p>
    {notice && <div role="status" className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</div>}
    {error && <div role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
    <form onSubmit={submit} className="space-y-5"><label className="block text-sm font-medium">Email<input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 w-full rounded-xl border px-4 py-3" /></label>
      <label className="block text-sm font-medium">Password<input type="password" required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-1 w-full rounded-xl border px-4 py-3" /></label>
      <div className="text-right"><Link to="/forgot-password" className="text-sm text-purple-main hover:underline">Forgot password?</Link></div>
      <button disabled={loading} className="btn btn-primary w-full disabled:opacity-60">{loading ? 'Signing in…' : 'Sign In'}</button>
    </form><div className="my-6 flex items-center gap-3 text-xs text-slate-400"><span className="h-px flex-1 bg-slate-200" />or continue with<span className="h-px flex-1 bg-slate-200" /></div>
    <GoogleSignInButton disabled={loading} onCredential={signInWithGoogle} onError={setError} />
    <p className="mt-8 text-center text-gray-600">Don't have an account? <Link to="/signup" className="font-medium text-purple-main">Sign up</Link></p>
  </div></div>;
}
