import { useEffect, useRef, useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { downloadFile } from '../../../utils/downloadFile';
import { useFile } from '../../../context/FileContext';
import SaveToDriveButton from '../../../components/SaveToDriveButton';

export default function SignPdf() {
  const canvasRef = useRef(null); const drawingRef = useRef(false);
  const { activeFiles } = useFile();
  const [file, setFile] = useState(() => activeFiles.find(item => item.type === 'application/pdf' || item.name.toLowerCase().endsWith('.pdf')) || null); const [page, setPage] = useState(1); const [pageCount, setPageCount] = useState(0); const [hasSignature, setHasSignature] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [result, setResult] = useState(null);
  useEffect(() => {
    if (!file || pageCount) return;
    let current = true;
    (async () => PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true }))().then(doc => {
      if (current) { setPageCount(doc.getPageCount()); setPage(doc.getPageCount()); }
    }).catch(cause => { if (current) setError(cause?.message || 'Could not read this PDF.'); });
    return () => { current = false; };
  }, [file, pageCount]);
  const point = event => { const rect = canvasRef.current.getBoundingClientRect(); return { x: (event.clientX - rect.left) * (canvasRef.current.width / rect.width), y: (event.clientY - rect.top) * (canvasRef.current.height / rect.height) }; };
  const start = event => { event.preventDefault(); const ctx = canvasRef.current.getContext('2d'); const p = point(event); ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineWidth=4; ctx.lineCap='round'; ctx.lineJoin='round'; ctx.strokeStyle='#172554'; drawingRef.current=true; canvasRef.current.setPointerCapture(event.pointerId); };
  const draw = event => { if (!drawingRef.current) return; const p=point(event); const ctx=canvasRef.current.getContext('2d'); ctx.lineTo(p.x,p.y); ctx.stroke(); setHasSignature(true); };
  const stop = () => { drawingRef.current=false; };
  const chooseFile = async selected => { if (!selected) return; try { const doc=await PDFDocument.load(await selected.arrayBuffer(),{ignoreEncryption:true}); setFile(selected); setPageCount(doc.getPageCount()); setPage(doc.getPageCount()); setResult(null); setError(''); } catch(cause) { setError(cause?.message || 'Could not read this PDF.'); } };
  const clearSignature = () => { const canvas=canvasRef.current; canvas?.getContext('2d').clearRect(0,0,canvas.width,canvas.height); setHasSignature(false); };
  const sign = async () => { if (!file || !hasSignature) { setError('Choose a PDF and draw your signature first.'); return; } setBusy(true); setError(''); try { const doc=await PDFDocument.load(await file.arrayBuffer(),{ignoreEncryption:true}); if (!Number.isInteger(Number(page)) || Number(page)<1 || Number(page)>doc.getPageCount()) throw new Error(`Choose a page between 1 and ${doc.getPageCount()}.`); const signature=await doc.embedPng(canvasRef.current.toDataURL('image/png')); const target=doc.getPage(Number(page)-1); const {width,height}=target.getSize(); const stampWidth=Math.min(width*0.36,signature.width); const stampHeight=stampWidth*signature.height/signature.width; target.drawImage(signature,{x:width*0.56-stampWidth/2,y:Math.max(24,height*0.12),width:stampWidth,height:stampHeight}); setResult(new Blob([await doc.save({useObjectStreams:false})],{type:'application/pdf'})); } catch(cause) { setError(cause?.message || 'Could not sign this PDF.'); } finally { setBusy(false); } };
  const download=async()=>{if(!result)return;await downloadFile(result,`${file.name.replace(/\.pdf$/i,'')}-signed.pdf`);};
  return <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-9"><h2 className="text-2xl font-bold">Sign a PDF</h2><p className="mb-6 mt-2 text-slate-500">Draw a signature and place it on the selected page. Your file stays in your browser.</p><label className="block rounded-2xl border-2 border-dashed border-purple-200 p-7 text-center text-sm font-semibold text-purple-700">Choose PDF<input className="sr-only" type="file" accept="application/pdf,.pdf" onChange={event=>chooseFile(event.target.files?.[0])}/></label>{file&&<div className="mt-5 space-y-4"><p className="text-sm text-slate-600">{file.name} · {pageCount} pages</p><label className="block text-sm">Place signature on page<input className="mt-1 w-full rounded-xl border p-3" type="number" min="1" max={pageCount} value={page} onChange={event=>setPage(event.target.value)}/></label><div><p className="mb-2 text-sm font-semibold">Draw your signature</p><canvas ref={canvasRef} width="900" height="240" onPointerDown={start} onPointerMove={draw} onPointerUp={stop} onPointerCancel={stop} className="h-40 w-full touch-none rounded-xl border border-slate-300 bg-white"/><button type="button" onClick={clearSignature} className="mt-2 text-sm text-slate-600 underline">Clear signature</button></div>{result?<><button onClick={download} className="btn btn-primary w-full">Download signed PDF</button><SaveToDriveButton blob={result} filename={`${file.name.replace(/\.pdf$/i,'')}-signed.pdf`}/></>:<button disabled={busy} onClick={sign} className="btn btn-primary w-full disabled:opacity-50">{busy?'Working...':'Add signature'}</button>}</div>}{error&&<p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}</div>;
}
