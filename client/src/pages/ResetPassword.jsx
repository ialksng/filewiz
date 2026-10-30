import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authRequest } from '../services/auth';
import useSeoMetadata from '../services/useSeoMetadata';

export default function ResetPassword() {
  useSeoMetadata({ title: 'Choose a new password · FileWiz', description: 'Set a new password for your FileWiz account.', robots: 'noindex, nofollow' });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const token = new URLSearchParams(window.location.search).get('token') || '';

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError("Passwords do not match");
    }

    setLoading(true);
    setError(null);

    try {
      if (!token) throw new Error('This password reset link is missing its token. Request a new link and try again.');
      await authRequest('/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) });
      navigate('/login', { replace: true, state: { message: 'Password updated. You can now sign in.' } });
    } catch (cause) { setError(cause.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 bg-bg-gray">
      <div className="w-full max-w-md card p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold text-navy-dark mb-2">New Password</h1>
          <p className="text-gray-500 font-body">Enter your new secure password</p>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-500 text-sm rounded-lg">{error}</div>}

        <form onSubmit={handlePasswordUpdate} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-navy-dark mb-1">New Password</label>
            <input 
              type="password" 
              required
              minLength={8}
              className="w-full px-4 py-3 rounded-xl border border-border-gray focus:outline-none focus:border-purple-main transition-all font-body bg-bg-gray"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-dark mb-1">Confirm Password</label>
            <input 
              type="password" 
              required
              minLength={8}
              className="w-full px-4 py-3 rounded-xl border border-border-gray focus:outline-none focus:border-purple-main transition-all font-body bg-bg-gray"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button type="submit" disabled={loading} className="w-full btn btn-primary mt-4">
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
