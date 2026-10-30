import { useState } from 'react';
import { formatJson } from '../../../services/utilityEngine';

export default function JsonFormatter() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [indent, setIndent] = useState(2);
  const [status, setStatus] = useState(null);
  const [copied, setCopied] = useState(false);

  const format = spaces => {
    if (!input.trim()) return;
    setResult('');
    const formatted = formatJson(input, spaces);
    if (formatted.valid) {
      setResult(formatted.formatted);
      setStatus({ valid: true, message: spaces ? 'Valid JSON formatted successfully.' : 'Valid JSON minified successfully.' });
    } else {
      setStatus({ valid: false, message: `Syntax error: ${formatted.error}` });
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch { setCopied(false); }
  };

  return <div className="mx-auto max-w-6xl space-y-5 animate-in fade-in duration-300">
    <header><h1 className="text-3xl font-extrabold text-slate-900">JSON Formatter & Validator</h1><p className="mt-1 text-slate-500">Format and validate JSON while keeping the original beside the result.</p></header>
    {status && <div role="status" className={`rounded-xl border p-4 text-sm font-medium ${status.valid ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'}`}>{status.message}</div>}
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="min-w-0 rounded-2xl border border-slate-200 bg-[#f5f5fa] p-4 shadow-sm sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-bold text-slate-800">JSON input</h2>
          <div className="flex items-center gap-2"><span className="text-xs font-bold text-slate-500">Indent</span>{[2, 4].map(spaces => <button key={spaces} onClick={() => setIndent(spaces)} className={`min-h-9 rounded-lg px-3 text-xs font-semibold ${indent === spaces ? 'bg-purple-600 text-white' : 'bg-white text-slate-600'}`}>{spaces} spaces</button>)}</div>
        </div>
          <textarea rows={16} value={input} onChange={event => { setInput(event.target.value); setResult(''); setStatus(null); }} placeholder={'{"paste": "your JSON here", "example": [1, 2, 3]}'} className="w-full rounded-xl border border-slate-200 bg-white p-4 font-mono text-xs leading-relaxed focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/10" />
        <div className="mt-3 grid grid-cols-2 gap-2"><button onClick={() => format(indent)} className="btn btn-primary min-h-11 px-3 text-sm">Format JSON</button><button onClick={() => format(0)} className="btn btn-outline min-h-11 px-3 text-sm">Minify</button></div>
      </section>
      <section className="min-w-0 rounded-2xl border border-slate-200 bg-[#f5f5fa] p-4 shadow-sm sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-2"><h2 className="font-bold text-slate-800">Formatted output</h2><button disabled={!result} onClick={copy} className="min-h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 disabled:opacity-40">{copied ? 'Copied! ✓' : 'Copy'}</button></div>
        <textarea rows={16} readOnly value={result} placeholder="Your formatted JSON will appear here." className="w-full rounded-xl border border-slate-200 bg-white p-4 font-mono text-xs leading-relaxed focus:outline-none" />
      </section>
    </div>
  </div>;
}
