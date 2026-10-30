import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useSeoMetadata from '../services/useSeoMetadata';
import { authRequest } from '../services/auth';
import GoogleSignInButton from '../components/GoogleSignInButton';

export default function Signup() {
  useSeoMetadata({ title: 'Create an account · FileWiz', description: 'Create a FileWiz account.', robots: 'noindex, nofollow' });
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false); const [error, setError] = useState(''); const navigate = useNavigate();
  const submit = async (event) => {
    event.preventDefault(); setLoading(true); setError('');
    try { await authRequest('/signup', { method: 'POST', body: JSON.stringify({ name, email, password }) }); navigate('/account', { replace: true }); }
    catch (cause) { setError(cause.message); }
    finally { setLoading(false); }
  };
  const signUpWithGoogle = async (credential) => {
    setLoading(true); setError('');
    try { await authRequest('/google', { method: 'POST', body: JSON.stringify({ credential, name }) }); navigate('/account', { replace: true }); }
    catch (cause) { setError(cause.message); }
    finally { setLoading(false); }
  };
  return <div className="min-h-screen flex items-center justify-center bg-bg-gray p-6"><div className="card w-full max-w-md p-8">
    <h1 className="mb-2 text-center text-3xl font-heading font-bold text-navy-dark">Create Account</h1><p className="mb-8 text-center text-gray-500">Create an account for your FileWiz profile and settings.</p>
    {error && <div role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
    <form onSubmit={submit} className="space-y-5"><label className="block text-sm font-medium">Full name<input type="text" required maxLength={80} autoComplete="name" value={name} onChange={e=>setName(e.target.value)} className="mt-1 w-full rounded-xl border px-4 py-3" /></label>
      <label className="block text-sm font-medium">Email<input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 w-full rounded-xl border px-4 py-3" /></label>
      <label className="block text-sm font-medium">Password<input type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-1 w-full rounded-xl border px-4 py-3" /></label>
      <button disabled={loading} className="btn btn-primary w-full disabled:opacity-60">{loading ? 'Creating…' : 'Create Account'}</button>
    </form><div className="my-6 flex items-center gap-3 text-xs text-slate-400"><span className="h-px flex-1 bg-slate-200" />or sign up with<span className="h-px flex-1 bg-slate-200" /></div>
    <GoogleSignInButton disabled={loading} onCredential={signUpWithGoogle} onError={setError} />
    <p className="mt-8 text-center text-gray-600">Already have an account? <Link to="/login" className="font-medium text-purple-main">Sign in</Link></p>
  </div></div>;
}
