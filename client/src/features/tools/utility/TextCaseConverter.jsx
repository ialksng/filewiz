import { useState } from 'react';

const convertText = (text, mode) => {
  if (mode === 'upper') return text.toUpperCase();
  if (mode === 'lower') return text.toLowerCase();
  if (mode === 'title') return text.toLowerCase().replace(/\b[\p{L}\p{N}]/gu, letter => letter.toUpperCase());
  if (mode === 'sentence') return text.toLowerCase().replace(/(^\s*|[.!?]\s+)([\p{L}])/gu, (_, prefix, letter) => prefix + letter.toUpperCase());
  const words = text.match(/[\p{L}\p{N}]+/gu) || [];
  if (mode === 'camel') return words.map((word, index) => index ? word[0].toUpperCase() + word.slice(1).toLowerCase() : word.toLowerCase()).join('');
  if (mode === 'snake') return words.map(word => word.toLowerCase()).join('_');
  return words.map(word => word.toLowerCase()).join('-');
};

export default function TextCaseConverter() {
  const [text, setText] = useState('');
  const [mode, setMode] = useState('title');
  const [copied, setCopied] = useState(false);
  const result = convertText(text, mode);
  const copy = async () => {
    try { await navigator.clipboard.writeText(result); setCopied(true); window.setTimeout(() => setCopied(false), 1600); }
    catch { setCopied(false); }
  };

  return <div className="mx-auto max-w-6xl space-y-5">
    <header><h1 className="text-3xl font-extrabold text-slate-900">Text case converter</h1><p className="mt-1 text-slate-500">Type or paste text and see the converted result alongside it.</p></header>
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="min-w-0 rounded-2xl border border-slate-200 bg-[#f5f5fa] p-4 shadow-sm sm:p-5">
        <h2 className="mb-3 font-bold text-slate-800">Original text</h2>
        <label className="block text-sm font-medium">Convert to<select className="mt-1 w-full rounded-xl border bg-white p-3" value={mode} onChange={event => setMode(event.target.value)}><option value="title">Title Case</option><option value="sentence">Sentence case</option><option value="upper">UPPERCASE</option><option value="lower">lowercase</option><option value="camel">camelCase</option><option value="snake">snake_case</option><option value="kebab">kebab-case</option></select></label>
        <textarea className="mt-3 min-h-64 w-full rounded-xl border border-slate-200 bg-white p-3" value={text} onChange={event => { setText(event.target.value); setCopied(false); }} placeholder="Paste or type text here" />
      </section>
      <section className="min-w-0 rounded-2xl border border-slate-200 bg-[#f5f5fa] p-4 shadow-sm sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-2"><h2 className="font-bold text-slate-800">Converted result</h2><button disabled={!result} onClick={copy} className="min-h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 disabled:opacity-40">{copied ? 'Copied! ✓' : 'Copy result'}</button></div>
        <textarea readOnly className="min-h-64 w-full rounded-xl border border-slate-200 bg-white p-3" value={result} placeholder="Your converted text will appear here" />
      </section>
    </div>
  </div>;
}
