import { useMemo, useState } from 'react';

async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
  } catch {
    // Fall through to the selection-based copy method for mobile browsers.
  }
  const field = document.createElement('textarea');
  field.value = text;
  field.style.position = 'fixed';
  field.style.opacity = '0';
  document.body.appendChild(field);
  field.select();
  document.execCommand('copy');
  field.remove();
}

export function UrlEncoder() {
  const [value, setValue] = useState('');
  const [mode, setMode] = useState('encode');
  const result = useMemo(() => {
    if (!value) return '';
    try {
      return mode === 'encode' ? encodeURIComponent(value) : decodeURIComponent(value);
    } catch {
      return '';
    }
  }, [mode, value]);
  const invalid = Boolean(value) && !result;
  return <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-5 sm:p-9">
    <h2 className="text-2xl font-bold">URL Encoder & Decoder</h2>
    <p className="mb-5 mt-2 text-slate-500">Encode special characters for links or decode URL-encoded text.</p>
    <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Conversion mode">
      {['encode', 'decode'].map(option => <button key={option} type="button" onClick={() => setMode(option)} aria-pressed={mode === option} className={`rounded-full px-4 py-2 text-sm font-semibold ${mode === option ? 'bg-purple-700 text-white' : 'bg-slate-100 text-slate-700'}`}>{option === 'encode' ? 'Encode' : 'Decode'}</button>)}
    </div>
    <label className="block text-sm font-semibold" htmlFor="url-input">{mode === 'encode' ? 'Text or URL to encode' : 'Encoded text to decode'}</label>
    <textarea id="url-input" rows={6} value={value} onChange={event => setValue(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 p-3" placeholder="Paste text or a URL" />
    <label className="mt-4 block text-sm font-semibold" htmlFor="url-output">Result</label>
    <textarea id="url-output" rows={6} readOnly value={result} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 p-3" placeholder="Result appears here" />
    {invalid && <p role="alert" className="mt-3 text-sm text-red-700">This text contains an invalid encoded URL sequence.</p>}
    {result && <button type="button" onClick={() => copyText(result)} className="btn btn-primary mt-4 w-full">Copy result</button>}
    <p className="mt-4 text-xs text-slate-500">Your text stays in this browser.</p>
  </div>;
}

export function UtmBuilder() {
  const [destination, setDestination] = useState('');
  const [source, setSource] = useState('');
  const [medium, setMedium] = useState('');
  const [campaign, setCampaign] = useState('');
  const [term, setTerm] = useState('');
  const [content, setContent] = useState('');
  const [copied, setCopied] = useState(false);
  const result = useMemo(() => {
    try {
      const parsed = new URL(destination);
      if (!['http:', 'https:'].includes(parsed.protocol)) return '';
      [['utm_source', source], ['utm_medium', medium], ['utm_campaign', campaign], ['utm_term', term], ['utm_content', content]]
        .forEach(([key, value]) => value.trim() && parsed.searchParams.set(key, value.trim()));
      return parsed.toString();
    } catch {
      return '';
    }
  }, [destination, source, medium, campaign, term, content]);
  const fields = [
    ['Campaign source', source, setSource, 'google, newsletter'],
    ['Campaign medium', medium, setMedium, 'cpc, email, social'],
    ['Campaign name', campaign, setCampaign, 'spring-sale'],
    ['Campaign term (optional)', term, setTerm, 'running shoes'],
    ['Campaign content (optional)', content, setContent, 'blue-banner'],
  ];
  const copy = async () => {
    await copyText(result);
    setCopied(true);
  };
  return <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-5 sm:p-9">
    <h2 className="text-2xl font-bold">UTM Link Builder</h2>
    <p className="mb-5 mt-2 text-slate-500">Add campaign tracking parameters to a link for analytics.</p>
    <div className="space-y-4">
      <label className="block text-sm font-semibold">Website URL<input type="url" value={destination} onChange={event => setDestination(event.target.value)} placeholder="https://example.com/page" className="mt-1 w-full rounded-xl border border-slate-300 p-3 font-normal" /></label>
      {fields.map(([label, value, setter, placeholder]) => <label key={label} className="block text-sm font-semibold">{label}<input value={value} onChange={event => { setter(event.target.value); setCopied(false); }} placeholder={placeholder} className="mt-1 w-full rounded-xl border border-slate-300 p-3 font-normal" /></label>)}
      <label className="block text-sm font-semibold">Tracked URL<textarea readOnly rows={4} value={result} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-normal" placeholder="Enter a valid website URL to build your tracked link" /></label>
      {result && <button type="button" onClick={copy} className="btn btn-primary w-full">{copied ? 'Copied' : 'Copy tracked URL'}</button>}
    </div>
    <p className="mt-4 text-xs text-slate-500">Your link is built locally. Existing query parameters are preserved.</p>
  </div>;
}
