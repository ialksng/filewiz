import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import useSeoMetadata from '../services/useSeoMetadata';
import { authRequest } from '../services/auth';

export default function ForgotPassword() {
  useSeoMetadata({ title: 'Reset your password · FileWiz', description: 'Request a password reset for your FileWiz account.', robots: 'noindex, nofollow' });
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleResetRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try { const result = await authRequest('/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }); setMessage(result.message); }
    catch (cause) { setError(cause.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 bg-bg-gray">
      <div className="w-full max-w-md card p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold text-navy-dark mb-2">Reset Password</h1>
          <p className="text-gray-500 font-body">We'll send a recovery link to your email</p>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-500 text-sm rounded-lg">{error}</div>}
        {message && <div className="mb-4 p-3 bg-green-50 text-green-600 text-sm rounded-lg">{message}</div>}

        <form onSubmit={handleResetRequest} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-navy-dark mb-1">Email Address</label>
            <input 
              type="email" 
              required
              className="w-full px-4 py-3 rounded-xl border border-border-gray focus:outline-none focus:border-purple-main focus:ring-2 focus:ring-purple-main/20 transition-all font-body bg-bg-gray"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button type="submit" disabled={loading} className="w-full btn btn-primary mt-4">
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <p className="text-center mt-8 text-gray-600 font-body">
          Remembered your password? <Link to="/login" className="text-purple-main font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
