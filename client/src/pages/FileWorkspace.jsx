import { useEffect, useMemo, useRef, useState } from 'react';
import { FileUp, Download, Save, RotateCw, Trash2, FileText, Image as ImageIcon, Table2, File as FileIcon, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { downloadFile } from '../utils/downloadFile';
import SaveToDriveButton from '../components/SaveToDriveButton';
import useSeoMetadata from '../services/useSeoMetadata';
import { usePremium } from '../context/premiumContextStore';
import { getAuthToken } from '../services/auth';
import apiBase from '../services/apiBase';

const MAX_FILE_SIZE = 50 * 1024 * 1024;
function parseCsv(text) {
  const rows = []; let row = []; let cell = ''; let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted && char === '"' && text[i + 1] === '"') { cell += '"'; i += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { row.push(cell); cell = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) { if (char === '\r' && text[i + 1] === '\n') i += 1; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += char;
  }
  if (quoted) throw new Error('This CSV file has an unclosed quoted field.');
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}
const kindOf = file => {
  const name = file.name.toLowerCase();
  if (name.endsWith('.doc')) return 'other';
  if (file.type.startsWith('image/')) return 'image';
  if (file.type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
  if (/\.(docx?)$/.test(name) || file.type.includes('word')) return 'word';
  if (/\.(xlsx|csv)$/.test(name) || file.type.includes('spreadsheet') || file.type === 'text/csv') return 'sheet';
  if (/\.(txt|md|json|xml|html|css|js|ts|jsx|tsx|yaml|yml|log|srt|vtt|csv)$/.test(name) || file.type.startsWith('text/')) return 'text';
  return 'other';
};

function AiSummary({ text }) {
  const { tier } = usePremium(); const [summary,setSummary]=useState(''); const [busy,setBusy]=useState(false); const [error,setError]=useState('');
  const summarize = async () => { setBusy(true);setError('');setSummary(''); try { const token=getAuthToken(); const response=await fetch(`${apiBase}/ai/summarize`,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify({text})});const body=await response.json().catch(()=>({}));if(!response.ok)throw new Error(body.error||'Could not summarize this document.');setSummary(body.summary); } catch(cause) { setError(cause.message); } finally { setBusy(false); } };
  if (tier !== 'premium') return <Link to="/pricing" className="mt-3 inline-flex rounded-lg border border-violet-200 px-3 py-2 text-sm font-semibold text-violet-700">✨ AI summary · Premium</Link>;
  return <div className="mt-4 rounded-xl border border-violet-100 bg-violet-50/50 p-4"><button type="button" disabled={busy||text.trim().length<40} onClick={summarize} className="btn btn-outline disabled:opacity-50">✨ {busy?'Summarizing…':'Summarize with AI'}</button><p className="mt-2 text-xs text-slate-500">When you choose this, the document text (up to 25,000 characters) is sent to FileWiz AI for summarization.</p>{error&&<p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}{summary&&<div className="mt-3 whitespace-pre-wrap rounded-lg bg-white p-4 text-sm leading-6">{summary}</div>}</div>;
}

function TextEditor({ file, onSave, editing }) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  useEffect(() => { let live = true; file.text().then(value => { if (live) { setText(value); setError(''); } }).catch(() => setError('This text file could not be read.')); return () => { live = false; }; }, [file]);
  return <>{editing ? <><textarea aria-label="Edit file contents" spellCheck={file.name.endsWith('.txt') || file.name.endsWith('.md')} value={text} onChange={event => setText(event.target.value)} className="min-h-[55vh] w-full resize-y rounded-xl border border-slate-200 bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-100" />{error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}<button disabled={Boolean(error)} onClick={() => onSave(new Blob([text], { type: file.type || 'text/plain;charset=utf-8' }), file.name)} className="btn btn-primary mt-3"><Save size={16}/> Save edited copy</button></> : <pre className="max-h-[65vh] min-h-40 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-sm leading-6">{text || 'This file is empty.'}</pre>}<AiSummary text={text}/></>;
}

function WordEditor({ file, onSave, editing }) {
  const { tier } = usePremium();
  const [text, setText] = useState('');
  const editorRef = useRef(null);
  const previewRef = useRef(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [previewError, setPreviewError] = useState('');
  useEffect(() => { let live = true; (async () => { try {
    if (file.name.toLowerCase().endsWith('.doc')) throw new Error('Legacy .doc files can be previewed/downloaded, but editing requires converting them to .docx first.');
    if (file.size === 0) throw new Error('This DOCX file is empty (0 bytes), so it has no document content to open. Re-save or download the document from Word, then open the saved file here.');
    const data = await file.arrayBuffer();
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(data);
    const source = await zip.file('word/document.xml')?.async('text');
    if (!source) throw new Error('Could not find editable document text in this Word file.');
    const xml = new DOMParser().parseFromString(source, 'application/xml');
    if (xml.querySelector('parsererror')) throw new Error('This Word document has invalid content.');
    const paragraphs = [...xml.getElementsByTagNameNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main','p')];
    const value = paragraphs.map(p => [...p.getElementsByTagNameNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main','t')].map(node => node.textContent || '').join('')).join('\n');
    if (live) setText(value);
    try {
      const { renderAsync } = await import('docx-preview');
      if (live && previewRef.current) await renderAsync(data, previewRef.current, previewRef.current, { className: 'filewiz-docx', inWrapper: true, breakPages: true, renderAltChunks: false });
    } catch {
      if (live) setPreviewError('This Word file could not be rendered as a page preview. You can still switch to Edit or download the original.');
    }
  } catch (cause) { if (live) setError(cause.message || 'Could not open this document.'); } finally { if (live) setBusy(false); } })(); return () => { live = false; }; }, [file]);
  const insertMarkup = (before,after=before) => { const editor=editorRef.current;if(!editor)return;const start=editor.selectionStart;const end=editor.selectionEnd;const selected=text.slice(start,end)||'text';const updated=`${text.slice(0,start)}${before}${selected}${after}${text.slice(end)}`;setText(updated);requestAnimationFrame(()=>{editor.focus();editor.setSelectionRange(start+before.length,start+before.length+selected.length);}); };
  const exportDocx = async () => { setBusy(true); setError(''); try { const { Document, HeadingLevel, Packer, Paragraph, TextRun } = await import('docx'); const children=text.split(/\r?\n/).map(line=>{const heading=line.match(/^(#{1,3})\s+(.*)$/);const content=heading?heading[2]:line;const runs=[];const pattern=/\*\*(.+?)\*\*|\*(.+?)\*/g;let last=0;for(const match of content.matchAll(pattern)){if(match.index>last)runs.push(new TextRun(content.slice(last,match.index)));runs.push(new TextRun({text:match[1]||match[2],bold:Boolean(match[1]),italics:Boolean(match[2])}));last=match.index+match[0].length;}if(last<content.length||!runs.length)runs.push(new TextRun(content.slice(last)));const options={children:runs};if(heading)options.heading=heading[1].length===1?HeadingLevel.HEADING_1:heading[1].length===2?HeadingLevel.HEADING_2:HeadingLevel.HEADING_3;else if(/^[-*]\s+/.test(line)){options.bullet={level:0};options.children=[new TextRun(line.replace(/^[-*]\s+/,''))];}return new Paragraph(options);});const doc=new Document({sections:[{children}]});const blob=await Packer.toBlob(doc);onSave(blob,file.name.replace(/\.docx?$/i,'')+'-edited.docx');} catch (cause) { setError(cause.message || 'Could not create the edited document.'); } finally { setBusy(false); } };
  if (busy && !text) return <p className="p-8 text-center text-slate-500">Opening document…</p>;
  if (error && !text) return <p role="alert" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">{error}</p>;
  return <>{editing&&<p className="mb-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">The edited copy keeps text and paragraph structure. Complex layouts, tables, images, and styling may be simplified. Use # for headings, **text** for bold, *text* for italic, and - for bullets.</p>}{editing&&tier==='premium'&&<div className="mb-2 flex flex-wrap gap-2"><button onClick={()=>insertMarkup('**')} className="rounded-lg border px-3 py-2 text-sm font-bold">Bold</button><button onClick={()=>insertMarkup('*')} className="rounded-lg border px-3 py-2 text-sm italic">Italic</button><button onClick={()=>insertMarkup('# ','')} className="rounded-lg border px-3 py-2 text-sm">Heading 1</button><button onClick={()=>insertMarkup('## ','')} className="rounded-lg border px-3 py-2 text-sm">Heading 2</button><button onClick={()=>insertMarkup('- ','')} className="rounded-lg border px-3 py-2 text-sm">Bullet</button></div>}{editing ? <textarea ref={editorRef} aria-label="Word document text" readOnly={tier !== 'premium'} value={text} onChange={event => setText(event.target.value)} className="min-h-[55vh] w-full rounded-xl border border-slate-200 p-4 text-sm leading-7 read-only:bg-slate-50"/> : <div ref={previewRef} aria-label="Word document preview" className="max-h-[75vh] overflow-auto rounded-xl border border-slate-200 bg-slate-100 p-4"/>}{previewError&&!editing&&<p role="status" className="mt-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{previewError}</p>}{editing&&tier==='premium'&&<button disabled={busy} onClick={exportDocx} className="btn btn-primary mt-3 disabled:opacity-50"><Save size={16}/>{busy ? 'Preparing…' : 'Download edited DOCX'}</button>}{error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}<AiSummary text={text}/></>;
}

function SheetEditor({ file, onSave, editing }) {
  const workbookRef = useRef(null);
  const [rows, setRows] = useState([]);
  const [sheetNames, setSheetNames] = useState([]);
  const [activeSheet, setActiveSheet] = useState(0);
  const [dirtyCells,setDirtyCells]=useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);
  useEffect(() => { let live = true; (async () => { try {
    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    if (file.name.toLowerCase().endsWith('.csv')) { const sheet = workbook.addWorksheet('Sheet1'); parseCsv(await file.text()).forEach(row => sheet.addRow(row)); }
    else await workbook.xlsx.load(await file.arrayBuffer());
    if (!workbook.worksheets.length) throw new Error('This workbook contains no worksheets.');
    workbookRef.current = workbook;
    if (live) { setSheetNames(workbook.worksheets.map(sheet => sheet.name)); setRows(sheetRows(workbook.worksheets[0])); setError(''); }
  } catch (cause) { if (live) setError(cause.message || 'Could not open this spreadsheet.'); } finally { if (live) setBusy(false); } })(); return () => { live = false; }; }, [file]);
  const changeSheet = index => { setActiveSheet(index); setDirtyCells({}); setRows(sheetRows(workbookRef.current.worksheets[index])); };
  const updateCell = (rowIndex, columnIndex, value) => { setRows(previous => previous.map((row, ri) => row.map((cell, ci) => ri === rowIndex && ci === columnIndex ? value : cell)));setDirtyCells(previous=>({...previous,[`${rowIndex}:${columnIndex}`]:value})); };
  const exportFile = async () => { try { const sheet = workbookRef.current.worksheets[activeSheet]; Object.entries(dirtyCells).forEach(([key,value])=>{const [ri,ci]=key.split(':').map(Number);sheet.getRow(ri+1).getCell(ci+1).value=value.startsWith('=')?{formula:value.slice(1)}:value;}); const blob = file.name.toLowerCase().endsWith('.csv') ? new Blob([await workbookRef.current.csv.writeBuffer()], { type: 'text/csv;charset=utf-8' }) : new Blob([await workbookRef.current.xlsx.writeBuffer()], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }); onSave(blob, file.name.replace(/\.(csv|xlsx?)$/i,'') + '-edited' + (file.name.toLowerCase().endsWith('.csv') ? '.csv' : '.xlsx')); } catch (cause) { setError(cause.message || 'Could not save this spreadsheet.'); } };
  if (busy) return <p className="p-8 text-center text-slate-500">Opening spreadsheet…</p>;
  if (error && !rows.length) return <p role="alert" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">{error}</p>;
  return <><label className="mb-3 flex items-center gap-2 text-sm">Sheet <select disabled={!editing} className="rounded-lg border p-2 disabled:bg-slate-50" value={activeSheet} onChange={event => changeSheet(Number(event.target.value))}>{sheetNames.map((name,index) => <option key={name} value={index}>{name}</option>)}</select></label><p className="mb-2 text-xs text-slate-500">{editing?'Click a cell to edit its value.':'Preview only. Choose Edit to make changes.'} Showing the first 200 rows and 50 columns.</p><div className="max-h-[55vh] overflow-auto rounded-xl border border-slate-200"><table className="min-w-full border-collapse text-sm"><tbody>{rows.map((row,ri)=><tr key={ri}><th className="sticky left-0 bg-slate-100 px-2 text-xs text-slate-500">{ri+1}</th>{row.map((cell,ci)=><td key={ci} className="min-w-32 border border-slate-200 p-0"><input readOnly={!editing} aria-label={`Row ${ri+1}, column ${ci+1}`} className="w-full min-w-32 px-2 py-2 outline-none read-only:bg-slate-50 focus:bg-violet-50" value={cell} onChange={event => updateCell(ri,ci,event.target.value)} /></td>)}</tr>)}</tbody></table></div>{editing&&<button onClick={exportFile} className="btn btn-primary mt-3"><Save size={16}/> Download edited spreadsheet</button>}{error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}</>;
}
function sheetRows(sheet) { const result = []; sheet.eachRow({ includeEmpty: true }, row => result.push(Array.from({ length: Math.min(Math.max(row.cellCount, 1), 50) }, (_, index) => { const value = row.getCell(index + 1).value; if (value && typeof value === 'object') return value.formula ? `=${value.formula}` : value.text || value.result || ''; return value == null ? '' : String(value); }))); return result.slice(0,200); }

function ImageEditor({ file, onSave, editing }) {
  const [rotation, setRotation] = useState(0);
  const [brightness,setBrightness]=useState(100);
  const [contrast,setContrast]=useState(100);
  const [saturation,setSaturation]=useState(100);
  const [flipHorizontal,setFlipHorizontal]=useState(false);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [error, setError] = useState('');
  const url = useMemo(() => URL.createObjectURL(file), [file]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  const exportImage = async () => { setError(''); try { const image = new Image(); image.src = url; await image.decode(); if (image.naturalWidth * image.naturalHeight > 40_000_000) throw new Error('This image is over 40 megapixels. Resize it with a dedicated image tool first.'); const sideways = rotation % 180 !== 0; const canvas = document.createElement('canvas'); canvas.width = width || (sideways ? image.naturalHeight : image.naturalWidth); canvas.height = height || (sideways ? image.naturalWidth : image.naturalHeight); const context = canvas.getContext('2d'); context.filter=`brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;context.translate(canvas.width/2,canvas.height/2); context.rotate(rotation*Math.PI/180); context.scale(flipHorizontal?-1:1,1); const scale = Math.min(canvas.width/(sideways?image.naturalHeight:image.naturalWidth),canvas.height/(sideways?image.naturalWidth:image.naturalHeight)); context.drawImage(image,-image.naturalWidth*scale/2,-image.naturalHeight*scale/2,image.naturalWidth*scale,image.naturalHeight*scale); const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg'; const blob = await new Promise((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error('Image export failed.')),type,0.92)); onSave(blob,file.name.replace(/\.[^.]+$/,'')+'-edited.'+(type==='image/png'?'png':'jpg')); } catch (cause) { setError(cause.message || 'Could not edit this image.'); } };
  return <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_16rem]"><div className="flex min-h-64 items-center justify-center rounded-xl bg-slate-100 p-3"><img src={url} alt="File preview" className="max-h-[65vh] max-w-full object-contain"/></div>{editing&&<div className="space-y-4"><button className="btn btn-outline w-full" onClick={() => setRotation(value => (value + 90)%360)}><RotateCw size={16}/> Rotate {rotation ? `${rotation}°` : '90°'}</button><button className="btn btn-outline w-full" onClick={()=>setFlipHorizontal(value=>!value)}>{flipHorizontal?'Unflip horizontally':'Flip horizontally'}</button>{[['Brightness',brightness,setBrightness],['Contrast',contrast,setContrast],['Saturation',saturation,setSaturation]].map(([label,value,setValue])=><label key={label} className="block text-sm">{label} · {value}%<input className="mt-1 w-full accent-violet-700" type="range" min="0" max="200" value={value} onChange={event=>setValue(Number(event.target.value))}/></label>)}<label className="block text-sm">Width (px)<input className="mt-1 w-full rounded-lg border p-2" type="number" min="1" max="10000" value={width || ''} placeholder="Original" onChange={event=>setWidth(Number(event.target.value)||0)}/></label><label className="block text-sm">Height (px)<input className="mt-1 w-full rounded-lg border p-2" type="number" min="1" max="10000" value={height || ''} placeholder="Original" onChange={event=>setHeight(Number(event.target.value)||0)}/></label><button onClick={exportImage} className="btn btn-primary w-full"><Download size={16}/> Export edited image</button>{error&&<p role="alert" className="text-sm text-red-700">{error}</p>}</div>}</div>;
}

function FileTab({ file, active, select, remove }) { const Icon = kindOf(file)==='image'?ImageIcon:kindOf(file)==='sheet'?Table2:kindOf(file)==='word'||kindOf(file)==='text'?FileText:FileIcon; return <div className={`flex min-w-0 items-center gap-2 rounded-xl border px-3 py-2 ${active?'border-violet-300 bg-violet-50':'border-slate-200 bg-white'}`}><button onClick={select} className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm font-medium"><Icon size={16} className="shrink-0 text-violet-700"/><span className="truncate">{file.name}</span></button><button onClick={remove} aria-label={`Close ${file.name}`} className="text-slate-400 hover:text-red-600"><Trash2 size={15}/></button></div>; }

export default function FileWorkspace() {
  const [files, setFiles] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [saved, setSaved] = useState(null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const fileInput = useRef(null);
  const activeFile = files[activeIndex];
  useSeoMetadata({ title: 'File Workspace · FileWiz', description: 'Open common files in your browser, make basic edits, and download or save the result to Google Drive.', canonicalPath: '/workspace', robots: 'index, follow' });
  const openFiles = selected => { const accepted = [...selected].filter(file => file.size <= MAX_FILE_SIZE); if ([...selected].some(file => file.size > MAX_FILE_SIZE)) setError('Files over 50 MB are skipped to keep browser editing responsive.'); else setError(''); if (accepted.length) { setFiles(previous => [...previous, ...accepted].slice(0,10)); setActiveIndex(Math.min(files.length,9)); setSaved(null); setEditing(false); } };
  const closeFile = index => { setFiles(previous => previous.filter((_,position)=>position!==index)); setActiveIndex(current => current > index ? current - 1 : Math.min(current, Math.max(files.length - 2,0))); setSaved(null); setEditing(false); };
  const saveCopy = (blob, filename) => { setSaved({ blob, filename }); downloadFile(blob, filename); };
  const fileKind = activeFile ? kindOf(activeFile) : '';
  const { tier } = usePremium();
  const supportsEditing = ['text','word','sheet','image'].includes(fileKind) && !(fileKind === 'word' && activeFile?.name.toLowerCase().endsWith('.doc'));
  const premiumEdit = tier !== 'premium' && ['word','sheet','image'].includes(fileKind);
  const activeFileUrl = useMemo(() => activeFile ? URL.createObjectURL(activeFile) : '', [activeFile]);
  useEffect(() => () => { if (activeFileUrl) URL.revokeObjectURL(activeFileUrl); }, [activeFileUrl]);

  return (
    <section className="mx-auto w-full max-w-7xl flex-1 bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-violet-700">FileWiz Workspace</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">Open. View. Edit when you choose.</h1>
          <p className="mt-2 max-w-2xl text-slate-600">Open files up to 50 MB. Your files stay on this device; supported formats open in a local preview.</p>
        </div>
        <button type="button" onClick={() => fileInput.current?.click()} className="btn btn-primary">
          <FileUp size={17} /> Open files
          <input ref={fileInput} className="sr-only" type="file" multiple accept="*/*" onChange={event => { if (event.target.files) openFiles(event.target.files); event.target.value = ''; }} />
        </button>
      </div>
      {error && <p role="alert" className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{error}</p>}
      {!files.length ? (
        <button onClick={() => fileInput.current?.click()} className="flex min-h-72 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-violet-200 bg-white p-8 text-center hover:bg-violet-50">
          <FileUp size={36} className="text-violet-600" />
          <span className="mt-3 text-lg font-bold text-slate-800">Choose a file to get started</span>
          <span className="mt-1 text-sm text-slate-500">Open any file. Preview it first, then choose Edit when the format supports editing.</span>
        </button>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap gap-2">
            {files.map((file, index) => <FileTab key={`${file.name}-${index}`} file={file} active={index === activeIndex} select={() => { setActiveIndex(index); setSaved(null); setEditing(false); }} remove={() => closeFile(index)} />)}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="min-w-0">
                <h2 className="truncate font-bold text-slate-900">{activeFile.name}</h2>
                <p className="text-xs text-slate-500">{(activeFile.size / 1024).toFixed(activeFile.size < 1024 * 1024 ? 1 : 0)} KB · {fileKind === 'other' ? 'Preview or download' : 'Local browser preview'}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <a href={activeFileUrl} download={activeFile.name} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Download size={15} /> Download original</a>
                {supportsEditing && !editing && (premiumEdit
                  ? <Link to="/pricing" className="inline-flex items-center gap-2 rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-800"><Save size={15} /> Edit · Premium</Link>
                  : <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-2 rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-800"><Save size={15} /> Edit</button>)}
                {supportsEditing && editing && <button type="button" onClick={() => setEditing(false)} className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Done viewing</button>}
              </div>
            </div>
            {fileKind === 'text' && <TextEditor key={activeIndex + activeFile.name} file={activeFile} onSave={saveCopy} editing={editing} />}
            {fileKind === 'word' && <WordEditor key={activeIndex + activeFile.name} file={activeFile} onSave={saveCopy} editing={editing} />}
            {fileKind === 'sheet' && <SheetEditor key={activeIndex + activeFile.name} file={activeFile} onSave={saveCopy} editing={editing} />}
            {fileKind === 'image' && <ImageEditor key={activeIndex + activeFile.name} file={activeFile} onSave={saveCopy} editing={editing} />}
            {fileKind === 'pdf' && <div className="space-y-3"><iframe title={`PDF preview: ${activeFile.name}`} src={activeFileUrl} className="h-[65vh] w-full rounded-xl border border-slate-200 bg-slate-100" /><p className="text-sm text-slate-600">Preview and download PDFs here. For page edits, use <Link className="font-semibold text-violet-700 underline" to="/tools/pdf">FileWiz PDF tools</Link>.</p></div>}
            {fileKind === 'other' && <div className="rounded-xl bg-slate-50 p-6 text-center"><FileIcon className="mx-auto text-slate-500" size={32} /><p className="mt-3 font-semibold text-slate-800">File opened · {activeFile.type || 'unknown file type'}</p><p className="mt-1 text-sm text-slate-600">The browser will preview formats it recognizes. If it can’t render this file type, download the original above and open it with a compatible app.</p>{activeFile.type.startsWith('audio/') && <audio className="mx-auto mt-4 max-w-full" controls src={activeFileUrl} />}{activeFile.type.startsWith('video/') && <video className="mx-auto mt-4 max-h-[55vh] max-w-full" controls src={activeFileUrl} />}{!activeFile.type.startsWith('audio/') && !activeFile.type.startsWith('video/') && <iframe sandbox="" title={`Browser preview: ${activeFile.name}`} src={activeFileUrl} className="mt-5 h-[60vh] w-full rounded-xl border border-slate-200 bg-white" />}{activeFile.type === 'text/html' && <a className="mt-3 inline-flex items-center gap-2 text-sm text-violet-700" target="_blank" rel="noreferrer" href={activeFileUrl}>Open preview <ExternalLink size={14} /></a>}</div>}
            {saved && <div className="mt-4 rounded-xl bg-emerald-50 p-4"><p className="text-sm font-semibold text-emerald-900">Edited copy downloaded: {saved.filename}</p><p className="mt-1 text-xs text-emerald-800">Want to save it to Drive as well?</p><SaveToDriveButton className="mt-3" blob={saved.blob} filename={saved.filename} /></div>}
          </div>
        </>
      )}
      <p className="mt-5 text-center text-xs text-slate-500">Your files are processed locally in this browser. Workspace files are not uploaded to FileWiz or saved between visits.</p>
    </section>
  );
}
