import { useState } from 'react';
import { useFile } from '../../../context/FileContext';
import { PDFDocument } from 'pdf-lib';
import { downloadFile } from '../../../utils/downloadFile';
import SaveToDriveButton from '../../../components/SaveToDriveButton';
import PdfPageWorkspace from './PdfPageWorkspace';

function parsePageList(value, pageCount) {
  const pages = new Set();
  for (const token of value.split(',').map(part => part.trim()).filter(Boolean)) {
    const match = token.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!match) throw new Error('Use page numbers and ranges such as 1, 3-5.');
    const start = Number(match[1]);
    const end = Number(match[2] || match[1]);
    if (start < 1 || end > pageCount || start > end) throw new Error(`Enter pages between 1 and ${pageCount}.`);
    for (let page = start; page <= end; page += 1) pages.add(page - 1);
  }
  return [...pages];
}

export default function ManagePdf({ mode = 'reorder' }) {
  const { activeFiles } = useFile();
  const [file, setFile] = useState(() => activeFiles.find(item => item.type === 'application/pdf' || item.name.toLowerCase().endsWith('.pdf')) || null);
  const [pages, setPages] = useState('');
  const [pageCount, setPageCount] = useState(0);
  const [pageOrder, setPageOrder] = useState([]);
  const [selectedPages, setSelectedPages] = useState([]);
  const [metadata, setMetadata] = useState({ title: '', author: '', subject: '', keywords: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const isMetadata = mode === 'metadata';
  const isRemove = mode === 'remove';
  const title = isMetadata ? 'Edit PDF metadata' : isRemove ? 'Remove PDF pages' : 'Reorder PDF pages';

  const selectFile = async selected => {
    if (!selected) return;
    setError(''); setResult(null); setFile(selected);
    try {
      const doc = await PDFDocument.load(await selected.arrayBuffer(), { ignoreEncryption: true });
      const count = doc.getPageCount(); setPageCount(count);
      const order = Array.from({ length: count }, (_, index) => index + 1);
      setPageOrder(order);
      setSelectedPages([]);
      setPages(isRemove ? '' : order.join(', '));
      setMetadata({ title: doc.getTitle() || '', author: doc.getAuthor() || '', subject: doc.getSubject() || '', keywords: (doc.getKeywords() || []).join(', ') });
    } catch (cause) { setFile(null); setError(cause?.message || 'Could not read this PDF.'); }
  };

  const process = async () => {
    if (!file) return;
    setBusy(true); setError('');
    try {
      const source = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
      let output = source;
      if (isMetadata) {
        output.setTitle(metadata.title); output.setAuthor(metadata.author); output.setSubject(metadata.subject);
        output.setKeywords(metadata.keywords.split(',').map(value => value.trim()).filter(Boolean));
      } else if (isRemove) {
        const remove = parsePageList(pages, source.getPageCount());
        if (remove.length >= source.getPageCount()) throw new Error('A PDF must keep at least one page.');
        output = await PDFDocument.create();
        const keep = source.getPageIndices().filter(index => !remove.includes(index));
        (await output.copyPages(source, keep)).forEach(page => output.addPage(page));
      } else {
        const order = pageOrder;
        if (order.length !== source.getPageCount() || order.some(value => !Number.isInteger(value) || value < 1 || value > source.getPageCount()) || new Set(order).size !== source.getPageCount()) {
          throw new Error(`Enter every page exactly once, separated by commas (1-${source.getPageCount()}).`);
        }
        output = await PDFDocument.create();
        (await output.copyPages(source, order.map(page => page - 1))).forEach(page => output.addPage(page));
      }
      setResult(new Blob([await output.save({ useObjectStreams: false })], { type: 'application/pdf' }));
    } catch (cause) { setError(cause?.message || 'Could not process this PDF.'); }
    finally { setBusy(false); }
  };

  const download = async () => {
    if (!result) return;
    await downloadFile(result, `${file.name.replace(/\.pdf$/i, '')}-${mode === 'metadata' ? 'metadata' : mode === 'remove' ? 'pages-removed' : 'reordered'}.pdf`);
  };

  return <div className={`${file && !isMetadata ? 'mx-auto max-w-6xl' : 'mx-auto max-w-2xl'} rounded-3xl border border-slate-200 bg-white p-5 sm:p-9`}>
    <h2 className="text-2xl font-bold">{title}</h2>
    <p className="mb-6 mt-2 text-slate-500">Your document is processed locally in this browser.</p>
    <label className="block rounded-2xl border-2 border-dashed border-purple-200 p-8 text-center text-sm font-semibold text-purple-700">Choose PDF<input className="sr-only" type="file" accept="application/pdf,.pdf" onChange={event => selectFile(event.target.files?.[0])}/></label>
    {file && (isMetadata ? <div className="mt-5 space-y-4"><p className="text-sm text-slate-600">{file.name} · {pageCount} pages</p>
      <div className="grid gap-3 sm:grid-cols-2">{[['title','Title'],['author','Author'],['subject','Subject'],['keywords','Keywords (comma separated)']].map(([key,label])=><label key={key} className="text-sm">{label}<input className="mt-1 w-full rounded-xl border p-3" value={metadata[key]} onChange={event=>setMetadata(current=>({...current,[key]:event.target.value}))}/></label>)}</div>
      {!result ? <button disabled={busy} onClick={process} className="btn btn-primary w-full disabled:opacity-50">{busy ? 'Processing…' : title}</button> : <><button onClick={download} className="btn btn-primary w-full">Download updated PDF</button><SaveToDriveButton className="mt-3" blob={result} filename={`${file.name.replace(/\.pdf$/i, '')}-${mode === 'metadata' ? 'metadata' : mode === 'remove' ? 'pages-removed' : 'reordered'}.pdf`} /></>}
    </div> : <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(18rem,0.85fr)]">
      <PdfPageWorkspace file={file} pages={pageOrder} onPagesChange={order => { setPageOrder(order); if (!isRemove) setPages(order.join(', ')); }} selectedPages={selectedPages} onSelectedPagesChange={isRemove ? selected => { setSelectedPages(selected); setPages(selected.join(', ')); } : undefined} selectionLabel="mark for removal" reorderable={!isRemove} />
      <div className="min-w-0 space-y-4"><p className="text-sm text-slate-600">{file.name} · {pageCount} pages</p>
        {isRemove ? <label className="block text-sm font-medium">Pages to remove<input className="mt-1 w-full rounded-xl border p-3" value={pages} onChange={event => {
          const value = event.target.value;
          setPages(value);
          try { setSelectedPages(parsePageList(value, pageCount).map(index => index + 1)); } catch { /* Keep the visual selection while the page list is incomplete. */ }
        }} placeholder="e.g. 2, 4-6"/><span className="mt-1 block text-xs text-slate-500">Tap thumbnails or enter page numbers to delete.</span></label> : <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Drag the page grips to arrange the new page order.</p>}
        {!result ? <button disabled={busy} onClick={process} className="btn btn-primary w-full disabled:opacity-50">{busy ? 'Processing…' : title}</button> : <><button onClick={download} className="btn btn-primary w-full">Download updated PDF</button><SaveToDriveButton className="mt-3" blob={result} filename={`${file.name.replace(/\.pdf$/i, '')}-${mode === 'metadata' ? 'metadata' : mode === 'remove' ? 'pages-removed' : 'reordered'}.pdf`} /></>}
      </div>
    </div>)}
    {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}
  </div>;
}
