import { useState } from 'react';
import { Link } from 'react-router-dom';
import apiBase from '../../../services/apiBase';

export default function UrlShortener() {
  const [url, setUrl] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const shorten = async event => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setShortUrl('');
    setCopied(false);
    try {
      const response = await fetch(`${apiBase}/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const responseText = await response.text();
      let result = {};
      if (responseText) {
        try {
          const payload = JSON.parse(responseText);
          result = payload && typeof payload === 'object' ? payload : {};
        } catch {
          throw new Error('The URL shortener returned an unreadable response. Please try again shortly.');
        }
      }
      if (!response.ok) throw new Error(result.error || 'Could not shorten this link. Please try again shortly.');
      if (!result.code) throw new Error('The URL shortener could not create a link. Please try again shortly.');
      setShortUrl(`${window.location.origin}${import.meta.env.BASE_URL}s/${result.code}`);
    } catch (cause) {
      setError(cause?.message || 'Could not connect to the URL shortener. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
    } catch {
      const field = document.createElement('textarea');
      field.value = shortUrl;
      field.style.position = 'fixed';
      field.style.opacity = '0';
      document.body.appendChild(field);
      field.select();
      document.execCommand('copy');
      field.remove();
    }
    setCopied(true);
  };

  return <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-5 sm:p-9">
    <h2 className="text-2xl font-bold">URL Shortener</h2>
    <p className="mb-6 mt-2 text-slate-500">Create a shareable FileWiz link that redirects to your destination.</p>
    <form onSubmit={shorten} className="space-y-4">
      <label className="block text-sm font-semibold text-slate-700" htmlFor="long-url">Long URL</label>
      <input id="long-url" type="url" required maxLength={2048} value={url} onChange={event => setUrl(event.target.value)} placeholder="https://example.com/your/long/link" className="w-full rounded-xl border border-slate-300 p-3 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/15" />
      <button disabled={busy} className="btn btn-primary w-full disabled:opacity-50">{busy ? 'Creating short link…' : 'Shorten URL'}</button>
    </form>
    {shortUrl && <div className="mt-5 rounded-2xl bg-emerald-50 p-4 sm:p-5">
      <p className="font-semibold text-emerald-800">Your short link is ready</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input aria-label="Short URL" readOnly value={shortUrl} className="min-w-0 flex-1 rounded-xl border border-emerald-200 bg-white p-3 text-sm" />
        <button type="button" onClick={copy} className="btn btn-primary sm:w-auto">{copied ? 'Copied' : 'Copy link'}</button>
      </div>
      <Link className="mt-3 inline-block text-sm font-semibold text-purple-700 underline" to={`/tools/utility/qr-generator?text=${encodeURIComponent(shortUrl)}`}>Make a QR code for this link</Link>
    </div>}
    {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <p className="mt-5 text-xs text-slate-500">Short links remain active for 90 days. The destination URL is stored so redirects work across devices; do not submit sensitive links. Only HTTP and HTTPS destinations are accepted.</p>
  </div>;
}
