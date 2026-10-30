import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import apiBase from '../services/apiBase';

export default function ShortLinkRedirect() {
  const { code } = useParams();
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetch(`${apiBase}/links/${encodeURIComponent(code)}`)
      .then(async response => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'This short link could not be found.');
        const destination = new URL(result.url);
        if (!['http:', 'https:'].includes(destination.protocol)) throw new Error('This short link has an invalid destination.');
        window.location.replace(destination.href);
      })
      .catch(cause => { if (active) setError(cause?.message || 'Could not open this short link.'); });
    return () => { active = false; };
  }, [code]);

  return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-5">
    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
      <h1 className="text-xl font-bold">{error ? 'Link unavailable' : 'Opening your link…'}</h1>
      <p className="mt-2 text-sm text-slate-600">{error || 'Please wait while FileWiz redirects you.'}</p>
      {error && <a href={import.meta.env.BASE_URL} className="mt-5 inline-block font-semibold text-purple-700 underline">Go to FileWiz</a>}
    </div>
  </main>;
}
