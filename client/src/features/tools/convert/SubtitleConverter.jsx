import { useState } from 'react';
import { downloadFile } from '../../../utils/downloadFile';

function convertSubtitle(text, target) {
  const source = text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const blocks = source.split(/\n{2,}/).map(block => block.trim()).filter(Boolean);
  const cues = blocks.filter(block => !/^(?:WEBVTT|NOTE|STYLE|REGION)(?:\s|$)/i.test(block));
  let count = 0;
  const converted = cues.map(block => {
    const lines = block.split('\n');
    const timingIndex = lines.findIndex(line => line.includes('-->'));
    if (timingIndex < 0) throw new Error('A subtitle cue is missing its timestamp line.');
    const timingMatch = lines[timingIndex].trim().match(/^(\S+)\s+-->\s+(\S+)(?:\s+(.*))?$/);
    const toTimestamp = value => {
      const match = value.match(/^(?:(\d{2,}):)?(\d{2}):(\d{2})[,.](\d{3})$/);
      if (!match || Number(match[2]) > 59 || Number(match[3]) > 59) throw new Error('A timestamp is invalid. Check the hours, minutes, seconds, and milliseconds.');
      return `${(match[1] || '00').padStart(2, '0')}:${match[2]}:${match[3]}${target === 'vtt' ? '.' : ','}${match[4]}`;
    };
    if (!timingMatch) throw new Error('A subtitle cue has an invalid timestamp line.');
    const timing = `${toTimestamp(timingMatch[1])} --> ${toTimestamp(timingMatch[2])}${target === 'vtt' && timingMatch[3] ? ` ${timingMatch[3]}` : ''}`;
    count += 1;
    const body = lines.slice(timingIndex + 1);
    if (!body.length) throw new Error('A subtitle cue has no text.');
    return [...(target === 'srt' ? [String(count)] : lines.slice(0, timingIndex)), timing, ...body].join('\n');
  });
  if (!count) throw new Error('No subtitle cues were found in this file.');
  return `${target === 'vtt' ? 'WEBVTT\n\n' : ''}${converted.join('\n\n')}\n`;
}

export default function SubtitleConverter() {
  const [file, setFile] = useState(null);
  const [target, setTarget] = useState('vtt');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [output, setOutput] = useState('');

  const chooseFile = selected => {
    setFile(selected);
    setOutput('');
    setError('');
    if (selected) setTarget(selected.name.toLowerCase().endsWith('.vtt') ? 'srt' : 'vtt');
  };
  const convert = async () => {
    if (!file) return;
    setBusy(true); setError(''); setOutput('');
    try { setOutput(convertSubtitle(await file.text(), target)); }
    catch (cause) { setError(cause?.message || 'Could not convert this subtitle file.'); }
    finally { setBusy(false); }
  };
  const download = () => {
    if (!output) return;
    const name = file.name.replace(/\.(srt|vtt)$/i, '') || 'subtitles';
    downloadFile(new Blob([output], { type: 'text/plain;charset=utf-8' }), `${name}.${target}`);
  };

  return <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-5 sm:p-9">
    <h2 className="text-2xl font-bold">SRT and VTT subtitle converter</h2>
    <p className="mb-6 mt-2 text-slate-500">Switch subtitle files between SubRip and WebVTT for video editors, players, and publishing platforms.</p>
    <label className="mb-4 block text-sm font-semibold">Convert to
      <select className="mt-1 w-full rounded-xl border border-slate-200 p-3" value={target} onChange={event => { setTarget(event.target.value); setOutput(''); }}>
        <option value="vtt">WebVTT (.vtt)</option><option value="srt">SubRip (.srt)</option>
      </select>
    </label>
    <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50/40 p-7 text-center font-semibold text-purple-800">
      {file ? file.name : 'Choose an SRT or VTT file'}
      <input className="sr-only" type="file" accept=".srt,.vtt,text/vtt,application/x-subrip" onChange={event => chooseFile(event.target.files?.[0] || null)} />
    </label>
    {file && <button disabled={busy} onClick={convert} className="btn btn-primary mt-4 w-full disabled:opacity-50">{busy ? 'Converting…' : `Convert to ${target.toUpperCase()}`}</button>}
    {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {output && <div className="mt-4 rounded-xl bg-emerald-50 p-4"><p className="font-semibold text-emerald-800">Subtitle file is ready.</p><button onClick={download} className="btn btn-primary mt-3 w-full">Download .{target}</button></div>}
    <p className="mt-5 text-xs text-slate-500">Conversion runs in your browser. Cue text and timing are preserved.</p>
  </div>;
}
