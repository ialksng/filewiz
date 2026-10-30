import { useEffect, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { downloadFile } from '../../../utils/downloadFile';
import { useFile } from '../../../context/FileContext';

pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href;

export default function PdfToImages() {
  const { activeFiles } = useFile();
  const [file, setFile] = useState(() => activeFiles.find(item => item.type === 'application/pdf' || item.name.toLowerCase().endsWith('.pdf')) || null); const [images, setImages] = useState([]); const [format, setFormat] = useState('image/jpeg'); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  useEffect(() => () => images.forEach(image => URL.revokeObjectURL(image.url)), [images]);
  const convert = async () => {
    if (!file) return;
    setBusy(true); setError(''); setImages([]);
    try {
      const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
      if (pdf.numPages > 50) throw new Error('For performance, convert PDFs with 50 pages or fewer.');
      const pages = [];
      for (let number = 1; number <= pdf.numPages; number += 1) {
        const page = await pdf.getPage(number); const viewport = page.getViewport({ scale: 1.6 });
        const canvas = document.createElement('canvas'); canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
        await page.render({ canvas, canvasContext: canvas.getContext('2d'), viewport }).promise;
        const blob = await new Promise((resolve, reject) => canvas.toBlob(result => result ? resolve(result) : reject(new Error(`Could not render page ${number}.`)), format, 0.92));
        pages.push({ number, blob, url: URL.createObjectURL(blob), extension: format === 'image/jpeg' ? 'jpg' : 'png' });
      }
      setImages(pages);
    } catch (cause) { setError(cause?.message || 'Could not convert this PDF.'); }
    finally { setBusy(false); }
  };
  return <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-9"><h2 className="text-2xl font-bold">PDF to images</h2><p className="mb-6 mt-2 text-slate-500">Export each page as a PNG or JPG. Files stay on your device.</p><label className="block rounded-2xl border-2 border-dashed border-purple-200 p-8 text-center text-sm font-semibold text-purple-700">Choose PDF<input className="sr-only" type="file" accept="application/pdf,.pdf" onChange={event=>{setFile(event.target.files?.[0]||null);setImages([]);setError('');}}/></label>{file && <div className="mt-4 flex flex-wrap items-end justify-between gap-3"><span className="text-sm text-slate-600">{file.name}</span><label className="text-sm">Image format<select className="mt-1 block rounded-xl border p-3" value={format} onChange={event=>setFormat(event.target.value)}><option value="image/jpeg">JPG</option><option value="image/png">PNG</option></select></label><button disabled={busy} onClick={convert} className="btn btn-primary disabled:opacity-50">{busy ? 'Rendering pages…' : 'Convert pages'}</button></div>}{error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}{images.length > 0 && <div className="mt-6 grid gap-4 sm:grid-cols-2">{images.map(({number,blob,url,extension})=><div key={number} className="rounded-xl border p-3"><img src={url} alt={`PDF page ${number}`} className="max-h-80 w-full object-contain"/><button type="button" onClick={()=>downloadFile(blob,`${file.name.replace(/\.pdf$/i,'')}-page-${number}.${extension}`)} className="mt-3 min-h-11 w-full text-center text-sm font-semibold text-purple-700">Download page {number}</button></div>)}</div>}</div>;
}
