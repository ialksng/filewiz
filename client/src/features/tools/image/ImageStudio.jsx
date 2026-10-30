import { useEffect, useState } from 'react';
import { downloadFileUrl } from '../../../utils/downloadFile';
import { useFile } from '../../../context/FileContext';

export default function ImageStudio({ mode = 'watermark' }) {
  const { activeFiles } = useFile();
  const [file, setFile] = useState(() => activeFiles.find(item => item.type.startsWith('image/')) || null); const [text, setText] = useState(''); const [position, setPosition] = useState('bottom-right'); const [filter, setFilter] = useState('grayscale(100%)'); const [flip, setFlip] = useState('horizontal'); const [opacity, setOpacity] = useState(70); const [output, setOutput] = useState(null); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const isFilter = mode === 'filter'; const isFlip = mode === 'flip';
  useEffect(() => () => { if (output) URL.revokeObjectURL(output); }, [output]);
  const run = async () => {
    if (!file) return;
    if (!isFilter && !text.trim()) { setError('Enter watermark text first.'); return; }
    setBusy(true); setError(''); if (output) URL.revokeObjectURL(output); setOutput(null);
    const sourceUrl = URL.createObjectURL(file);
    try {
      const image = new Image(); image.src = sourceUrl; await image.decode();
      if (image.naturalWidth * image.naturalHeight > 40_000_000) throw new Error('This image is over 40 megapixels. Resize it before applying edits.');
      const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (isFilter) ctx.filter = filter;
      if (isFlip) { ctx.translate(flip === 'horizontal' ? canvas.width : 0, flip === 'vertical' ? canvas.height : 0); ctx.scale(flip === 'horizontal' ? -1 : 1, flip === 'vertical' ? -1 : 1); }
      ctx.drawImage(image, 0, 0); ctx.filter = 'none';
      if (!isFilter && !isFlip) {
        const size = Math.max(18, Math.round(canvas.width * 0.045)); const padding = Math.round(size * 0.7);
        ctx.font = `600 ${size}px Arial, sans-serif`; ctx.textBaseline = 'middle';
        const width = ctx.measureText(text.trim()).width; const x = position.endsWith('left') ? padding : position.endsWith('center') ? (canvas.width - width) / 2 : canvas.width - width - padding;
        const y = position.startsWith('top') ? padding : position.startsWith('center') ? canvas.height / 2 : canvas.height - padding;
        ctx.globalAlpha = Number(opacity) / 100; ctx.fillStyle = '#ffffff'; ctx.shadowColor = '#000000'; ctx.shadowBlur = Math.max(2, size * 0.2); ctx.fillText(text.trim(), x, y);
      }
      const blob = await new Promise((resolve, reject) => canvas.toBlob(result => result ? resolve(result) : reject(new Error('Could not export this image format.')), 'image/png'));
      setOutput(URL.createObjectURL(blob));
    } catch (cause) { setError(cause?.message || 'Could not process this image.'); }
    finally { URL.revokeObjectURL(sourceUrl); setBusy(false); }
  };
  const download = () => { if (!output) return; downloadFileUrl(output, `${file.name.replace(/\.[^.]+$/, '')}-${isFilter ? 'filtered' : isFlip ? 'flipped' : 'watermarked'}.png`); };
  return <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-9"><h2 className="text-2xl font-bold">{isFilter ? 'Image filters' : isFlip ? 'Flip image' : 'Add image watermark'}</h2><p className="mb-6 mt-2 text-slate-500">Make the edit locally in your browser and download a PNG copy.</p><label className="block rounded-2xl border-2 border-dashed border-purple-200 p-8 text-center text-sm font-semibold text-purple-700">Choose image<input className="sr-only" type="file" accept="image/*" onChange={event=>{setFile(event.target.files?.[0]||null);setOutput(null);setError('');}}/></label>{file && <div className="mt-5 space-y-4"><p className="text-sm text-slate-600">{file.name}</p>{isFilter ? <label className="block text-sm">Effect<select className="mt-1 w-full rounded-xl border p-3" value={filter} onChange={event=>setFilter(event.target.value)}><option value="grayscale(100%)">Grayscale</option><option value="sepia(100%)">Sepia</option><option value="contrast(150%)">High contrast</option><option value="brightness(115%) saturate(125%)">Bright and vivid</option><option value="invert(100%)">Invert colors</option></select></label> : isFlip ? <label className="block text-sm">Direction<select className="mt-1 w-full rounded-xl border p-3" value={flip} onChange={event=>setFlip(event.target.value)}><option value="horizontal">Flip horizontally</option><option value="vertical">Flip vertically</option></select></label> : <><label className="block text-sm">Watermark text<input className="mt-1 w-full rounded-xl border p-3" maxLength="80" value={text} onChange={event=>setText(event.target.value)} placeholder="Your name or brand"/></label><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm">Position<select className="mt-1 w-full rounded-xl border p-3" value={position} onChange={event=>setPosition(event.target.value)}><option value="bottom-right">Bottom right</option><option value="bottom-left">Bottom left</option><option value="center">Center</option><option value="top-right">Top right</option><option value="top-left">Top left</option></select></label><label className="text-sm">Opacity: {opacity}%<input className="mt-3 w-full" type="range" min="15" max="100" value={opacity} onChange={event=>setOpacity(event.target.value)}/></label></div></>}<button disabled={busy} onClick={run} className="btn btn-primary w-full disabled:opacity-50">{busy ? 'Processing…' : isFilter ? 'Apply filter' : isFlip ? 'Flip image' : 'Create watermarked image'}</button></div>}{error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}{output && <div className="mt-6 rounded-xl bg-slate-50 p-4"><img src={output} alt="Edited preview" className="mx-auto max-h-96 max-w-full rounded-lg object-contain"/><button onClick={download} className="btn btn-primary mt-4 w-full">Download PNG</button></div>}</div>;
}
