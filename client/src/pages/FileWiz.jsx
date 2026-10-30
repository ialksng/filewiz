import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Clock3, Search, Shield, Sparkles, Upload, X, FileStack, FileImage, FileSpreadsheet, Wrench } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getRecentTools } from '../services/recentTools';
import { FREE_PLAN } from '../services/filewizConfig';
import { getToolComponent } from '../features/ToolRegistry';
import { compressImage, convertImageFormat, resizeImage, transformImage } from '../services/imageEngine';
import { useFile } from '../context/FileContext';
import { downloadFile } from '../utils/downloadFile';
import { usePremium } from '../context/premiumContextStore';
import { billingRequest, loadRazorpayCheckout } from '../services/billing';
import { PDFDocument } from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import { tools } from '../services/toolDefinitions';
import useSeoMetadata from '../services/useSeoMetadata';

const BASE = '';
pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href;
const pathFor = (tool) => {
  if (tool.category === 'Convert') return `/convert/${tool.id}`;
  const type = tool.category === 'PDF' ? 'pdf' : tool.category === 'Image' ? 'image' : 'utility';
  return `/tools/${type}/${tool.engine || tool.id}`;
};

function PageFrame({ children }) {
  return <div className="min-h-[70vh] bg-slate-50/70 text-slate-900">{children}</div>;
}

function ToolTile({ tool }) {
  return <Link to={pathFor(tool)} className="group flex min-h-36 items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-violet-300 hover:bg-violet-50/40 sm:p-5"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-xl" aria-hidden="true">{tool.icon}</span><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2 font-semibold text-slate-900 group-hover:text-violet-800">{tool.name}<ArrowRight size={15} className="shrink-0 text-violet-700"/></span><span className="mt-1 block text-sm leading-5 text-slate-500">{tool.description}</span></span></Link>;
}

function DropInput({ accept, multiple = false, onFiles }) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const acceptFiles = (list) => {
    const files = [...list];
    if (!files.length) return;
    const validFile = file => accept.split(',').some(rawToken => {
      const token = rawToken.trim().toLowerCase();
      if (token.startsWith('.')) return file.name.toLowerCase().endsWith(token);
      if (token.endsWith('/*')) return file.type.toLowerCase().startsWith(token.slice(0, -1));
      return file.type.toLowerCase() === token;
    });
    const unsupported = files.find(file => !validFile(file));
    if (unsupported) { setError(`${unsupported.name} is not a supported file type for this tool.`); return; }
    const oversized = files.find(file => file.size > FREE_PLAN.maxFileSizeMb * 1024 * 1024);
    if (oversized) { setError(`${oversized.name} exceeds the ${FREE_PLAN.maxFileSizeMb} MB per-file limit.`); return; }
    setError(''); onFiles(files);
  };
  return <div onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); acceptFiles(event.dataTransfer.files); }} className={`rounded-2xl border-2 border-dashed p-8 text-center ${dragging ? 'border-purple-500 bg-purple-50' : 'border-purple-200 bg-white'}`}>
    <Upload className="mx-auto mb-3 text-purple-600"/><p className="font-semibold">Drop a file here, or choose one</p><p className="mt-1 text-xs text-slate-500">Up to {FREE_PLAN.maxFileSizeMb} MB per file · most tools run on your device</p>
    <label className="btn btn-primary mt-5 cursor-pointer text-sm">Choose file<input className="sr-only" type="file" accept={accept} multiple={multiple} onChange={event => acceptFiles(event.target.files)} /></label>
    {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
  </div>;
}

function ImageAction({ tool }) {
  const { activeFiles } = useFile();
  const [file, setFile] = useState(() => activeFiles?.[0] || null); const [width, setWidth] = useState(1200); const [height, setHeight] = useState(800); const [format, setFormat] = useState('image/webp'); const [rotation, setRotation] = useState(90); const [busy, setBusy] = useState(false); const [output, setOutput] = useState(null); const [error, setError] = useState('');
  const run = async () => { if (!file) return; setBusy(true); setError(''); try { let blob;
      if (tool.id === 'compress-image') blob = await compressImage(file, { maxSizeMB: 1, maxWidthOrHeight: 2048, useWebWorker: true });
      else if (tool.id === 'convert-image') blob = await convertImageFormat(file, format);
      else if (tool.id === 'rotate-image') blob = await transformImage(file, { rotation: Number(rotation) });
      else if (tool.id === 'crop-image' || tool.id === 'resize-image') {
        const outputWidth = Number(width); const outputHeight = Number(height);
        if (!Number.isInteger(outputWidth) || !Number.isInteger(outputHeight) || outputWidth < 1 || outputHeight < 1 || outputWidth > 10000 || outputHeight > 10000 || outputWidth * outputHeight > 25_000_000) throw new Error('Enter whole-number dimensions under 10,000 px and 25 megapixels total.');
        blob = await resizeImage(file, { width: outputWidth, height: outputHeight, fit: tool.id === 'crop-image' ? 'cover' : 'contain' });
      }
      setOutput(blob);
    } catch (cause) { setError(cause?.message || 'The image could not be processed. Try another image.'); } finally { setBusy(false); } };
  const download = async () => { if (!output) return; await downloadFile(output, `${file.name.replace(/\.[^.]+$/, '')}-${tool.id.replace('-image','')}.${output.type.split('/')[1] === 'jpeg' ? 'jpg' : output.type.split('/')[1] || 'png'}`); };
  return <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-9"><h2 className="text-2xl font-bold">{tool.name}</h2><p className="mb-6 mt-2 text-slate-500">This image stays on your device while it is processed.</p>{output ? <div className="rounded-2xl bg-emerald-50 p-6 text-center"><p className="font-semibold text-emerald-800">Your image is ready.</p><button className="btn btn-primary mt-4" onClick={download}>Download image</button><button className="ml-3 mt-4 text-sm text-slate-600" onClick={() => { setOutput(null); setFile(null); }}>Start over</button></div> : <><DropInput accept="image/png,image/jpeg,image/webp,image/gif" onFiles={files => { setFile(files[0]); setOutput(null); }} />{file && <div className="mt-5 space-y-4"><p className="text-sm text-slate-600">Selected: {file.name}</p>{tool.id === 'convert-image' && <label className="block text-sm">Output format<select className="mt-1 w-full rounded-xl border p-3" value={format} onChange={event => setFormat(event.target.value)}><option value="image/webp">WebP</option><option value="image/jpeg">JPEG</option><option value="image/png">PNG</option></select></label>}{['resize-image','crop-image'].includes(tool.id) && <div className="grid grid-cols-2 gap-3"><label className="text-sm">Width (px)<input type="number" min="1" max="10000" className="mt-1 w-full rounded-xl border p-3" value={width} onChange={event => setWidth(event.target.value)} /></label><label className="text-sm">Height (px)<input type="number" min="1" max="10000" className="mt-1 w-full rounded-xl border p-3" value={height} onChange={event => setHeight(event.target.value)} /></label></div>}{tool.id === 'rotate-image' && <label className="block text-sm">Rotation<select className="mt-1 w-full rounded-xl border p-3" value={rotation} onChange={event => setRotation(event.target.value)}><option value="90">90° clockwise</option><option value="180">180°</option><option value="270">270° clockwise</option></select></label>}<button disabled={busy} className="btn btn-primary w-full disabled:opacity-50" onClick={run}>{busy ? 'Processing…' : tool.name}</button></div>}{error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}</>}</div>;
}

function TextConvertAction({ tool }) {
  const { activeFiles } = useFile();
  const [file, setFile] = useState(() => activeFiles.find(item => item.type === 'application/pdf' || item.name.toLowerCase().endsWith('.pdf')) || null); const [text, setText] = useState(''); const [result, setResult] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const run = async () => { setBusy(true); setError(''); try {
    if (tool.id === 'pdf-to-text') {
      if (!file || file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) throw new Error('Choose a PDF file first.');
      const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise; const pages = [];
      for (let n = 1; n <= doc.numPages; n += 1) { const page = await doc.getPage(n); const content = await page.getTextContent(); pages.push(content.items.map(item => item.str).join(' ')); }
      setResult(pages.join('\n\n'));
    } else {
      if (!text.trim()) throw new Error('Enter some text first.');
      const doc = await PDFDocument.create(); const font = await doc.embedFont('Helvetica'); const page = doc.addPage(); const size = 11; const margin = 48; const maxWidth = page.getWidth() - margin * 2; const lines = [];
      for (const paragraph of text.split('\n')) { let line = ''; for (const word of paragraph.split(/\s+/)) { const candidate = line ? `${line} ${word}` : word; if (font.widthOfTextAtSize(candidate, size) > maxWidth && line) { lines.push(line); line = word; } else line = candidate; } lines.push(line); }
      let y = page.getHeight() - margin; let current = page; for (const line of lines) { if (y < margin) { current = doc.addPage(); y = current.getHeight() - margin; } current.drawText(line, { x: margin, y, size, font }); y -= 16; }
      const blob = new Blob([await doc.save({useObjectStreams:false})], { type: 'application/pdf' }); await downloadFile(blob, 'filewiz-text.pdf'); setResult('PDF downloaded or shared.');
    }
  } catch (cause) { setError(cause?.message || 'Conversion failed.'); } finally { setBusy(false); } };
  return <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-9"><h2 className="text-2xl font-bold">{tool.name}</h2><p className="mb-6 mt-2 text-slate-500">Conversion runs locally in this browser.</p>{tool.id === 'pdf-to-text' ? <DropInput accept="application/pdf,.pdf" onFiles={files => setFile(files[0])}/> : <label className="block text-sm font-medium">Text<textarea className="mt-2 min-h-48 w-full rounded-xl border p-3" value={text} onChange={event => setText(event.target.value)} placeholder="Type or paste text to make a PDF" /></label>}<button disabled={busy || tool.id === 'pdf-to-text' && !file} className="btn btn-primary mt-5 w-full disabled:opacity-50" onClick={run}>{busy ? 'Working…' : tool.id === 'pdf-to-text' ? 'Extract text' : 'Create PDF'}</button>{error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}{result && <div className="mt-5 rounded-xl bg-emerald-50 p-4"><p className="font-medium text-emerald-800">{tool.id === 'pdf-to-text' ? 'Text extracted. Copy or download it below.' : result}</p>{tool.id === 'pdf-to-text' && <><textarea className="mt-3 min-h-48 w-full rounded-lg border p-3" readOnly value={result}/><button className="btn btn-outline mt-3" onClick={async () => { await downloadFile(new Blob([result], { type: 'text/plain;charset=utf-8' }), 'extracted.txt'); }}>Download text</button></>}</div>}</div>;
}

function FileWizLanding() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [uploadError, setUploadError] = useState('');
  const [recentTools] = useState(() => getRecentTools());
  const navigate = useNavigate();
  const { setActiveFiles } = useFile();

  const categories = [
    { label: 'PDF', path: '/tools/pdf', icon: FileStack, count: tools.filter(tool => tool.category === 'PDF').length },
    { label: 'Images', path: '/tools/image', icon: FileImage, count: tools.filter(tool => tool.category === 'Image').length },
    { label: 'Conversions', path: '/tools/convert', icon: FileSpreadsheet, count: tools.filter(tool => tool.category === 'Convert').length },
    { label: 'Utilities', path: '/tools/utility', icon: Wrench, count: tools.filter(tool => tool.category === 'Utilities').length },
  ];

  const startWithFiles = files => {
    if (!files?.length) return;
    setActiveFiles(files);
    const file = files[0];
    const name = file.name.toLowerCase();
    const mime = file.type.toLowerCase();
    const type = mime === 'application/pdf' || name.endsWith('.pdf') ? 'pdf'
      : mime.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp|avif|svg)$/i.test(name) ? 'image'
        : /\.(docx?)$/i.test(name) || /word/.test(mime) ? 'word'
          : /\.(xlsx?|csv)$/i.test(name) || /spreadsheet|excel|csv/.test(mime) ? 'excel'
            : /\.(pptx?)$/i.test(name) || /presentation|powerpoint/.test(mime) ? 'ppt' : null;
    if (!type) {
      setUploadError('This file type is not supported yet. Choose a PDF, image, Word, Excel, CSV, or PowerPoint file.');
      return;
    }
    setUploadError('');
    navigate(`/tools/${type}`);
  };

  const categoriesForFilter = ['All', 'PDF', 'Image', 'Convert', 'Utilities'];
  const filtered = tools.filter(tool => (category === 'All' || tool.category === category)
    && `${tool.name} ${tool.description}`.toLowerCase().includes(query.trim().toLowerCase()));
  const popular = ['merge-pdf', 'split-pdf', 'compress-pdf', 'convert-image', 'resize-image', 'url-shortener']
    .map(id => tools.find(tool => tool.id === id)).filter(Boolean);

  return (
    <PageFrame>
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12 lg:px-8">
        <section className="grid items-center gap-8 overflow-hidden rounded-[2rem] border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-indigo-50 p-6 sm:p-10 lg:grid-cols-[1fr_.92fr] lg:p-14">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-violet-800">
              <Sparkles size={14} aria-hidden="true" /> Free tools for everyday files
            </p>
            <h1 className="mt-5 text-4xl font-bold leading-[1.08] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Get your file work done. <span className="text-violet-700">Then get on with your day.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
              Merge PDFs, resize images, convert documents, and more—all in one simple workspace.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-600">
              <span className="inline-flex items-center gap-2"><Shield size={16} className="text-violet-700" /> Most tools run on your device</span>
              <span className="inline-flex items-center gap-2"><Clock3 size={16} className="text-violet-700" /> No account needed</span>
            </div>
          </div>

          <div className="rounded-3xl border border-white bg-white p-4 shadow-xl shadow-violet-900/5 sm:p-6">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-900">Start with a file</h2>
              <p className="mt-1 text-sm text-slate-500">We’ll show the tools that match it.</p>
            </div>
            <DropInput accept="application/pdf,.pdf,image/*,.docx,.xls,.xlsx,.csv,.pptx,.svg" onFiles={startWithFiles} />
            {uploadError && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{uploadError}</p>}
            <p className="mt-3 text-center text-xs text-slate-500">PDF · Images · Word · Excel · CSV · PowerPoint</p>
          </div>
        </section>

        {recentTools.length > 0 && (
          <section className="mt-10" aria-labelledby="recent-title">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700"><Clock3 size={16} className="text-violet-700"/><h2 id="recent-title">Pick up where you left off</h2></div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {recentTools.slice(0, 6).map(tool => <Link key={tool.id} to={`/tools/${tool.category}/${tool.id}`} className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-violet-300 hover:bg-violet-50"><span aria-hidden="true">{tool.icon}</span>{tool.name}<ArrowRight size={14} className="text-violet-700"/></Link>)}
            </div>
          </section>
        )}

        <section className="mt-12" aria-labelledby="categories-title">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div><p className="text-sm font-semibold text-violet-700">Find your workspace</p><h2 id="categories-title" className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">What are you working on?</h2></div>
            <Link to="/tools" className="hidden items-center gap-1 text-sm font-semibold text-violet-700 hover:text-violet-900 sm:inline-flex">All tools <ArrowRight size={15}/></Link>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {categories.map(({ label, path, icon: Icon, count }) => <Link key={label} to={path} className="group rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-violet-300 hover:shadow-md sm:p-5"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-700 transition group-hover:bg-violet-100"><Icon size={21}/></span><span className="mt-4 block font-semibold text-slate-900">{label}</span><span className="mt-1 block text-sm text-slate-500">{count} tools</span></Link>)}
          </div>
        </section>

        <section className="mt-12" id="tools" aria-labelledby="tools-title">
          <div className="mb-5"><p className="text-sm font-semibold text-violet-700">Quick access</p><h2 id="tools-title" className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Popular tools</h2></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {popular.map(tool => <ToolTile key={tool.id} tool={tool}/>) }
          </div>
        </section>

        <section className="mt-12 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7" aria-labelledby="search-title">
          <div className="mb-4"><p className="text-sm font-semibold text-violet-700">Browse the full collection</p><h2 id="search-title" className="mt-1 text-xl font-bold text-slate-950">Find a specific tool</h2></div>
          <label className="relative block"><Search className="absolute left-3.5 top-3.5 text-slate-400" size={18}/><input aria-label="Search tools" value={query} onChange={event => setQuery(event.target.value)} placeholder="Try “split PDF” or “resize image”" className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"/></label>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Filter tools by category">
            {categoriesForFilter.map(value => <button key={value} type="button" onClick={() => setCategory(value)} aria-pressed={category === value} className={`shrink-0 rounded-full px-3.5 py-2 text-sm font-medium transition ${category === value ? 'bg-violet-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{value === 'Convert' ? 'Conversions' : value === 'Image' ? 'Images' : value}</button>)}
          </div>
          {(query || category !== 'All') && <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{filtered.slice(0, 9).map(tool => <ToolTile key={tool.id} tool={tool}/>)}{filtered.length === 0 && <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600 sm:col-span-2 lg:col-span-3">No matches yet. Try a shorter search or choose a different category.</p>}</div>}
        </section>

        <p className="mt-8 text-center text-xs leading-5 text-slate-500">Many tools process files directly in your browser. Tools that use an external service explain it before you continue.</p>
      </div>
    </PageFrame>
  );
}


function ProductsDirectory() { return <PageFrame><section className="mx-auto max-w-6xl px-5 py-16"><p className="text-sm font-semibold text-purple-700">Products</p><h1 className="mt-2 text-4xl font-extrabold">Tools for everyday work</h1><p className="mt-3 max-w-2xl text-slate-600">Explore FileWiz tools.</p><div className="mt-9 max-w-md"><ToolTile tool={{ ...tools[0], name: 'FileWiz', description: 'A collection of practical PDF, image, and conversion tools.', path: '' }}/><Link className="btn btn-primary mt-4" to="/">Explore FileWiz <ArrowRight size={16}/></Link></div></section></PageFrame>; }

function ToolsDirectory({ category = '' }) { const [query, setQuery] = useState(''); const filtered = tools.filter(tool => (!category || tool.category === category) && `${tool.name} ${tool.category} ${tool.description}`.toLowerCase().includes(query.toLowerCase())); return <PageFrame><section className="mx-auto max-w-6xl px-5 py-12"><Link to="/" className="text-sm text-purple-700">← FileWiz</Link><h1 className="mt-3 text-4xl font-extrabold">{category ? `${category} tools` : 'All FileWiz tools'}</h1><label className="relative mt-6 block max-w-lg"><Search className="absolute left-3 top-3.5 text-slate-400" size={18}/><input aria-label="Search tools" className="w-full rounded-xl border bg-white py-3 pl-10 pr-4" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search by tool or file type"/></label><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{filtered.map(tool=><ToolTile key={tool.id} tool={tool}/>)}</div>{!filtered.length && <p className="mt-10 text-slate-500">No tools match that search.</p>}</section></PageFrame>; }

function PricingPage() {
  const { user } = useAuth(); const premium = usePremium();
  const [config,setConfig] = useState({ amount:9,enabled:false }); const [busy,setBusy] = useState(false); const [message,setMessage] = useState(''); const [error,setError] = useState('');
  useEffect(()=>{ billingRequest('/config').then(setConfig).catch(()=>setConfig(value=>({...value,enabled:false}))); },[]);
  const subscribe = async () => {
    if (!user) return;
    setBusy(true);setError('');setMessage('');
    try {
      const order=await billingRequest('/subscriptions',{method:'POST',body:'{}'});
      await loadRazorpayCheckout();
      const checkout=new window.Razorpay({key:order.keyId,subscription_id:order.subscriptionId,name:'FileWiz',description:'FileWiz Premium · monthly subscription',prefill:{email:user.email||''},theme:{color:'#6d28d9'},handler:async response=>{try{await billingRequest('/subscriptions/verify',{method:'POST',body:JSON.stringify(response)});await premium.refresh();setMessage('Premium is active on your account.');}catch(cause){setError(cause.message);}}});
      checkout.on('payment.failed',response=>setError(response.error?.description||'Payment did not complete. You have not been charged for a successful subscription.'));
      checkout.open();
    } catch(cause) { setError(cause.message); } finally { setBusy(false); }
  };
  return <PageFrame><section className="mx-auto max-w-5xl px-5 py-16"><h1 className="text-4xl font-extrabold">Simple plans</h1><p className="mt-3 text-slate-600">All core file tools stay available. Premium adds an ad-free experience, Google Drive saves, advanced workspace controls, and AI document summaries.</p>{message&&<p role="status" className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}{error&&<p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}<div className="mt-8 grid gap-5 md:grid-cols-2"><div className="rounded-3xl border border-slate-200 bg-white p-8"><p className="font-bold text-slate-700">Free</p><p className="mt-2 text-4xl font-extrabold">₹0</p><ul className="mt-5 space-y-3 text-sm text-slate-600">{['Core PDF, image, and conversion tools','Local browser file processing','Ad-supported access','50 MB maximum file size per file'].map(item=><li key={item} className="flex gap-2"><Check size={17} className="text-emerald-600"/>{item}</li>)}</ul><Link to="/" className="btn btn-outline mt-7 w-full">Use FileWiz</Link></div><div className="rounded-3xl border-2 border-purple-300 bg-white p-8 shadow-lg"><p className="font-bold text-purple-700">FileWiz Premium</p><p className="mt-2 text-4xl font-extrabold">₹{config.amount}<span className="text-base font-medium text-slate-500"> / month</span></p><ul className="mt-5 space-y-3 text-sm text-slate-600">{['No ads while Premium is active','Save tool results to Google Drive','Premium workspace editing controls','AI summaries for document text'].map(item=><li key={item} className="flex gap-2"><Check size={17} className="text-emerald-600"/>{item}</li>)}</ul>{premium.tier==='premium'?<p className="mt-7 rounded-xl bg-emerald-50 p-3 text-center text-sm font-semibold text-emerald-800">Premium is active</p>:user?<button disabled={busy||!config.enabled} onClick={subscribe} className="btn btn-primary mt-7 w-full disabled:opacity-60">{busy?'Preparing secure checkout…':config.enabled?'Subscribe with Razorpay':'Premium checkout is being configured'}</button>:<Link to="/login" state={{from:'/pricing'}} className="btn btn-primary mt-7 w-full">Sign in to subscribe</Link>}{!config.enabled&&<p className="mt-2 text-center text-xs text-slate-500">Checkout will appear once Razorpay, the billing database, and webhook are configured.</p>}</div></div><p className="mt-5 text-xs text-slate-500">Subscriptions are billed monthly through Razorpay. Cancel anytime; cancellation takes effect at the end of the current billing period.</p></section></PageFrame>;
}

function AccountPage({ section }) {
  const { user, loading } = useAuth();
  const premium = usePremium();
  const location = useLocation();
  const [status, setStatus] = useState(location.state?.message || '');
  const { updateProfile: updateUserProfile, logout: signOut } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [activity] = useState(getRecentTools());
  const navigate = useNavigate();
  useEffect(() => setName(user?.name || ''), [user]);

  if (loading) return <PageFrame><div className="p-16 text-center">Loading account…</div></PageFrame>;
  if (!user) return <PageFrame><div className="mx-auto max-w-xl px-5 py-20 text-center"><h1 className="text-3xl font-bold">Sign in to your account</h1><p className="mt-3 text-slate-600">Sign in to manage your FileWiz account.</p><Link className="btn btn-primary mt-6" to="/login" state={{ from: `/account${section ? `/${section}` : ''}` }}>Sign in</Link></div></PageFrame>;

  const items = [['Overview',''],['Profile','profile'],['Security','security'],['Purchases','purchases'],['Subscription','subscription'],['Usage','usage'],['History','history']];
  const plan = premium.tier === 'premium' ? 'Premium' : FREE_PLAN.label;
  const saveProfile = async (event) => {
    event.preventDefault();
    try { await updateUserProfile(name.trim()); setStatus('Profile updated.'); }
    catch (error) { setStatus(error.message); }
  };
  const logout = async () => { await signOut(); navigate(BASE); };
  const cancelSubscription = async () => { setStatus(''); try { await billingRequest('/subscriptions/cancel',{method:'POST',body:'{}'}); setStatus('Cancellation is scheduled for the end of your current billing period.'); await premium.refresh(); } catch (error) { setStatus(error.message || 'Could not cancel the subscription.'); } };
  const accountTitle = items.find(([, path]) => path === section)?.[0] || 'Overview';

  return <PageFrame><section className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
    <div className="flex flex-wrap items-center justify-between gap-3"><Link to="/" className="text-sm font-medium text-purple-700">← FileWiz</Link><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">{plan} account</span></div>
    <div className="mt-5 grid min-w-0 gap-5 md:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="h-fit min-w-0 rounded-2xl border border-slate-200 bg-white p-3">
        <p className="px-3 py-3 font-bold">My account</p>
        <nav aria-label="Account sections" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-2 md:mx-0 md:block md:overflow-visible md:px-0 md:pb-0">
          {items.map(([label, path]) => <Link key={path} to={`${BASE}/account${path ? `/${path}` : ''}`} className={`shrink-0 rounded-lg px-3 py-2 text-sm md:block ${section === path ? 'bg-purple-50 font-semibold text-purple-800' : 'text-slate-600 hover:bg-slate-50'}`}>{label}</Link>)}
        </nav>
        <button onClick={logout} className="mt-2 w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50">Sign out</button>
      </aside>
      <div className="min-h-80 min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-8">
        <h1 className="text-2xl font-bold">{accountTitle}</h1>
        {section === 'profile' ? <form onSubmit={saveProfile} className="mt-6 max-w-lg space-y-4">
          <label className="block text-sm">Email address<input className="mt-1 w-full min-w-0 rounded-xl border bg-slate-50 p-3" readOnly value={user.email || ''}/></label>
          <label className="block text-sm">Display name<input className="mt-1 w-full min-w-0 rounded-xl border p-3" maxLength="80" value={name} onChange={event => setName(event.target.value)}/></label>
          <p className="text-xs text-slate-500">Account created {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'date unavailable'}.</p>
          <button className="btn btn-primary w-full sm:w-auto" type="submit">Save profile</button>{status && <p role="status" className="text-sm text-emerald-700">{status}</p>}
        </form> : section === 'security' ? <div className="mt-5 max-w-xl space-y-4 text-sm text-slate-600">
          {status && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-emerald-800">{status}</p>}
          <p>To reset your password, we’ll send a secure link to the email on this account.</p>
          <p className="break-all font-medium text-slate-800">{user.email}</p>
          <Link className="btn btn-primary inline-flex w-full justify-center sm:w-auto" to="/forgot-password" state={{ email: user.email }}>Send password reset link</Link>
          <p>Open the link from your email to choose a new password. You can also sign out of shared devices here.</p>
        </div> : section === 'history' ? <div className="mt-5">{activity.length ? <ul className="divide-y">{activity.map(item => <li key={item.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"><span>{item.icon} {item.name}</span><span className="text-sm text-slate-500">{new Date(item.timestamp).toLocaleString()}</span></li>)}</ul> : <p className="mt-4 text-slate-500">No recent tools on this browser yet. History is stored locally on this device.</p>}</div> : section === 'usage' ? <div className="mt-5 rounded-xl bg-slate-50 p-5"><p className="font-semibold">{plan} plan</p><p className="mt-2 text-sm text-slate-600">Maximum file size: {FREE_PLAN.maxFileSizeMb} MB per file. Core tools do not use a server-side monthly quota. Usage counters are not currently stored.</p></div> : section === 'purchases' ? <p className="mt-5 rounded-xl bg-slate-50 p-5 text-sm text-slate-600">Razorpay manages Premium subscription payments. Contact support if you need a payment record for a specific charge.</p> : section === 'subscription' ? <div className="mt-5 rounded-xl bg-slate-50 p-5 text-sm text-slate-600"><p className="font-semibold text-slate-800">Current status: {plan}</p>{premium.tier==='premium'?<><p className="mt-2">Premium includes ad-free access, Google Drive saves, advanced workspace editing, and AI document summaries.</p>{premium.expiresAt&&<p className="mt-2">Current billing period ends {new Date(premium.expiresAt).toLocaleDateString()}.</p>}{premium.canCancelSubscription&&<button type="button" onClick={cancelSubscription} className="mt-4 rounded-lg border border-red-200 px-4 py-2 font-semibold text-red-700 hover:bg-red-50">Cancel subscription</button>}{status&&<p role="status" className="mt-3">{status}</p>}</>:<><p className="mt-2">Upgrade to FileWiz Premium for ₹{premium.monthlyPrice||9} per month.</p><Link className="btn btn-primary mt-4 inline-flex" to="/pricing">Explore Premium</Link></>}</div> : <>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-xl border bg-purple-50/60 p-4"><p className="text-xs font-medium text-slate-500">Plan status</p><p className="mt-1 text-lg font-bold text-purple-800">{plan}</p><Link to="/account/subscription" className="mt-2 inline-block text-sm font-semibold text-purple-700">Subscription details →</Link></div>
            <div className="rounded-xl border p-4"><p className="text-xs font-medium text-slate-500">Email</p><p className="mt-1 break-all font-semibold">{user.email || 'Not available'}</p><p className="mt-2 text-xs text-slate-500">{user.email_confirmed_at ? 'Verified' : 'Verification status unavailable'}</p></div>
            <div className="rounded-xl border p-4"><p className="text-xs font-medium text-slate-500">Account created</p><p className="mt-1 font-semibold">{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Not available'}</p></div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{[['Profile','profile'],['Security','security'],['Usage','usage'],['Subscription','subscription'],['Purchases','purchases'],['History','history']].map(([label, path]) => <Link className="rounded-xl border p-4 font-semibold transition hover:border-purple-300 hover:bg-purple-50/50" key={path} to={`${BASE}/account/${path}`}>{label}<ArrowRight size={14} className="ml-2 inline"/></Link>)}</div>
          <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-600"><p className="font-semibold text-slate-800">Account security</p><p className="mt-1">Need a new password? Send a recovery link to {user.email}.</p><Link className="mt-3 inline-flex font-semibold text-purple-700" to="/forgot-password" state={{ email: user.email }}>Reset password →</Link></div>
        </>}
      </div>
    </div>
  </section></PageFrame>;
}

export default function FileWiz() {
  const location = useLocation(); const childPath = location.pathname.replace(/^\/+|\/+$/g, '');
  const [uploadError, setUploadError] = useState('');
  const tool = tools.find(item => item.path.replace(/^\//, '') === childPath);
  const pageMetadata = {
    '': { title: 'Online PDF, Image & File Tools · FileWiz', description: 'Convert, organize, and refine PDFs and images with free browser-based FileWiz tools.' },
    pricing: { title: 'FileWiz Pricing', description: 'Explore FileWiz access and features. Core PDF and image tools are available free in your browser.' },
    tools: { title: 'Browse PDF, Image & Utility Tools · FileWiz', description: 'Find browser-based tools for PDFs, images, conversions, and everyday utilities.' },
    convert: { title: 'File Conversion Tools · FileWiz', description: 'Convert PDFs, text, and images with FileWiz tools that run in your browser.' },
  };
  const metadata = tool
    ? { title: `${tool.name} · FileWiz`, description: tool.description, canonicalPath: pathFor(tool) }
    : pageMetadata[childPath];
  useSeoMetadata({
    title: metadata?.title || 'Page not found · FileWiz',
    description: metadata?.description || 'The requested FileWiz page could not be found.',
    canonicalPath: metadata
      ? metadata.canonicalPath || (location.pathname === '/' ? '/' : location.pathname)
      : undefined,
    robots: metadata ? 'index, follow' : 'noindex, nofollow',
  });
  if (!childPath) return <FileWizLanding/>;
  if (childPath === 'products') return <ProductsDirectory/>;
  if (childPath === 'tools') return <ToolsDirectory/>;
  if (childPath === 'convert') return <ToolsDirectory category="Convert"/>;
  if (childPath === 'pricing') return <PricingPage/>;
  if (childPath === 'account' || childPath.startsWith('account/')) return <AccountPage section={childPath.split('/')[1] || ''}/>;
  if (childPath === 'forgot-password') return <PageFrame><ForgotPassword/></PageFrame>;
  if (childPath === 'reset-password') return <PageFrame><ResetPassword/></PageFrame>;
  if (!tool) return <PageFrame><section className="mx-auto max-w-3xl px-5 py-20 text-center"><h1 className="text-3xl font-bold">That tool isn’t available</h1><p className="mt-3 text-slate-600">Choose from the FileWiz tools that are ready to use.</p><Link to={`${BASE}/tools`} className="btn btn-primary mt-6">Browse tools</Link></section></PageFrame>;
  const legacy = getToolComponent(tool.engine);
  return <PageFrame><section onChangeCapture={event => { const files = event.target.files; if (!files?.length) return; const oversized = [...files].find(file => file.size > FREE_PLAN.maxFileSizeMb * 1024 * 1024); if (oversized) { event.stopPropagation(); event.target.value = ''; setUploadError(`${oversized.name} exceeds the ${FREE_PLAN.maxFileSizeMb} MB per-file limit.`); } else setUploadError(''); }} className="mx-auto max-w-6xl px-5 py-8"><div className="mb-6 flex items-center justify-between"><div><Link to={`${BASE}/tools`} className="text-sm text-purple-700">All tools</Link><h1 className="mt-2 text-3xl font-extrabold">{tool.name}</h1></div><Link to={`${BASE}/tools`} aria-label="Close tool" className="rounded-full p-2 text-slate-500 hover:bg-white"><X/></Link></div>{uploadError && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{uploadError}</p>}{['compress-image','resize-image','crop-image','rotate-image','convert-image'].includes(tool.id) ? <ImageAction key={tool.id} tool={tool}/> : tool.id === 'pdf-to-text' || tool.id === 'text-to-pdf' ? <TextConvertAction key={tool.id} tool={tool}/> : legacy ? <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-8">{legacy}</div> : <Navigate to={`${BASE}/tools`} replace/>}</section></PageFrame>;
}
