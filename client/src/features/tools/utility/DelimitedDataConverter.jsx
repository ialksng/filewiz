import { useState } from 'react';
import { downloadFile } from '../../../utils/downloadFile';
import { useFile } from '../../../context/FileContext';

function parseDelimited(text, delimiter = ',') {
  const rows = []; let row = []; let cell = ''; let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') { cell += '"'; index += 1; }
      else if (character === '"') quoted = false;
      else cell += character;
    } else if (character === '"' && cell === '') quoted = true;
    else if (character === delimiter) { row.push(cell); cell = ''; }
    else if (character === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''; }
    else cell += character;
  }
  if (quoted) throw new Error('CSV contains an unclosed quoted field.');
  if (cell.length || row.length) { row.push(cell.replace(/\r$/, '')); rows.push(row); }
  return rows;
}

function quoteDelimited(value, delimiter) {
    const text = String(value ?? '');
    return text.includes('"') || text.includes('\r') || text.includes('\n') || text.includes(delimiter)
      ? `"${text.replaceAll('"', '""')}"`
      : text;
}

function toDelimited(values, delimiter = ',') {
  const quote = value => quoteDelimited(value, delimiter);
  const columns = [...new Set(values.flatMap(value => Object.keys(value || {})))];
  if (!columns.length) throw new Error('The JSON should be an array of objects.');
  return [columns.map(quote).join(delimiter), ...values.map(value => columns.map(key => quote(value?.[key])).join(delimiter))].join('\r\n');
}

export default function DelimitedDataConverter({ initialMode = 'csv-json' }) {
  const { activeFiles } = useFile();
  const [mode, setMode] = useState(initialMode);
  const [file, setFile] = useState(() => activeFiles.find(item => item.name.toLowerCase().endsWith('.csv') || item.type === 'text/csv') || null);
  const [source, setSource] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const isDelimited = mode === 'csv-tsv' || mode === 'tsv-csv';
  const readsFile = mode === 'csv-json' || isDelimited;
  const changeMode = nextMode => { setMode(nextMode); setFile(null); setSource(''); setResult(''); setError(''); };
  const convert = async () => {
    setBusy(true); setError(''); setResult('');
    try {
      if (readsFile) {
        if (!file) throw new Error(`Choose a ${mode === 'tsv-csv' ? 'TSV' : 'CSV'} file first.`);
        const inputDelimiter = mode === 'tsv-csv' ? '\t' : ',';
        const rows = parseDelimited(source, inputDelimiter);
        if (mode === 'csv-json' && rows.length < 2) throw new Error('CSV needs a header row and at least one data row.');
        if (isDelimited) {
          const outputDelimiter = mode === 'csv-tsv' ? '\t' : ',';
          setResult(rows.map(row => row.map(value => quoteDelimited(value, outputDelimiter)).join(outputDelimiter)).join('\r\n'));
          return;
        }
        const headers = rows[0].map((value, index) => value.trim() || `column_${index + 1}`);
        const objects = rows.slice(1).filter(row => row.some(cell => cell !== '')).map(row => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ''])));
        setResult(JSON.stringify(objects, null, 2));
      } else {
        const value = JSON.parse(source);
        if (!Array.isArray(value) || value.some(item => !item || Array.isArray(item) || typeof item !== 'object')) throw new Error('Provide a JSON array of objects.');
        setResult(toDelimited(value));
      }
    } catch (cause) { setError(cause?.message || 'Could not convert this data.'); }
    finally { setBusy(false); }
  };
  const download = async () => {
    const extension = mode === 'csv-json' ? 'json' : mode === 'json-csv' || mode === 'tsv-csv' ? 'csv' : 'tsv';
    const blob = new Blob([result], { type: extension === 'json' ? 'application/json;charset=utf-8' : 'text/plain;charset=utf-8' });
    await downloadFile(blob, `converted.${extension}`);
  };

  return <div className="mx-auto max-w-6xl space-y-5 rounded-3xl border border-slate-200 bg-white p-5 sm:p-8">
    <header>
      <h2 className="text-2xl font-bold">Data format converter</h2>
      <p className="mt-2 text-slate-500">Convert CSV and JSON data locally, including quoted delimiters and line breaks.</p>
    </header>
    <label className="block max-w-sm text-sm font-medium">Conversion<select className="mt-1 w-full rounded-xl border p-3" value={mode} onChange={event => changeMode(event.target.value)}><option value="csv-json">CSV to JSON</option><option value="json-csv">JSON to CSV</option><option value="csv-tsv">CSV to TSV</option><option value="tsv-csv">TSV to CSV</option></select></label>
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="min-w-0 rounded-2xl border border-slate-200 bg-[#f5f5fa] p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-2"><h3 className="font-bold text-slate-800">{mode === 'json-csv' ? 'JSON input' : mode === 'tsv-csv' ? 'TSV input' : 'CSV input'}</h3>{file && <span className="max-w-[60%] truncate text-xs text-slate-500" title={file.name}>{file.name}</span>}</div>
        {readsFile && <label className="mb-3 block cursor-pointer rounded-xl border border-dashed border-purple-300 bg-white p-3 text-center text-sm font-semibold text-purple-700">Choose {mode === 'tsv-csv' ? 'TSV' : 'CSV'}<input className="sr-only" type="file" accept={mode === 'tsv-csv' ? '.tsv,text/tab-separated-values,text/plain' : '.csv,text/csv'} onChange={async event => {
          const selected = event.target.files?.[0] || null;
          setFile(selected); setResult(''); setError('');
          setSource(selected ? await selected.text() : '');
        }}/></label>}
        <textarea readOnly={readsFile} className="min-h-64 w-full rounded-xl border border-slate-200 bg-white p-3 font-mono text-xs leading-5" value={source} onChange={event => { setSource(event.target.value); setResult(''); }} placeholder={readsFile ? 'Choose a data file to preview its contents.' : '[{"name":"Ada","role":"Engineer"}]'} />
      </section>
      <section className="min-w-0 rounded-2xl border border-slate-200 bg-[#f5f5fa] p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-2"><h3 className="font-bold text-slate-800">{mode === 'csv-json' ? 'JSON output' : mode === 'json-csv' || mode === 'tsv-csv' ? 'CSV output' : 'TSV output'}</h3>{result && <span className="text-xs text-slate-500">Ready to download</span>}</div>
        <textarea readOnly className="min-h-64 w-full rounded-xl border border-slate-200 bg-white p-3 font-mono text-xs leading-5" value={result} placeholder="Your converted data will appear here." />
        {result && <button onClick={download} className="btn btn-primary mt-3 w-full">Download {mode === 'csv-json' ? 'JSON' : mode === 'json-csv' || mode === 'tsv-csv' ? 'CSV' : 'TSV'}</button>}
      </section>
    </div>
    <button disabled={busy || (readsFile ? !file : !source.trim())} onClick={convert} className="btn btn-primary w-full disabled:opacity-50">{busy ? 'Converting…' : 'Convert'}</button>
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
  </div>;
}
