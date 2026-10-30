import { useEffect, useRef, useState } from 'react';
import { downloadFileUrl } from '../../../utils/downloadFile';
import { useFile } from '../../../context/FileContext';

export default function BlurArea() {
  const { activeFiles } = useFile();
  const imageRef = useRef(null);
  const dragRef = useRef(null);
  const [file, setFile] = useState(() => activeFiles.find(item => item.type.startsWith('image/')) || null);
  const [sourceUrl, setSourceUrl] = useState('');
  const [selection, setSelection] = useState(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!file) { setSourceUrl(''); return undefined; }
    const url = URL.createObjectURL(file);
    setSourceUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const getPoint = event => {
    const bounds = imageRef.current.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width)),
      y: Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height)),
    };
  };
  const startSelection = event => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = getPoint(event);
    dragRef.current = point;
    setSelection({ x: point.x, y: point.y, w: 0, h: 0 });
  };
  const updateSelection = event => {
    if (!dragRef.current) return;
    const point = getPoint(event); const start = dragRef.current;
    setSelection({ x: Math.min(start.x, point.x), y: Math.min(start.y, point.y), w: Math.abs(start.x - point.x), h: Math.abs(start.y - point.y) });
  };
  const endSelection = event => { updateSelection(event); dragRef.current = null; };

  const applyBlur = async () => {
    if (!file || !selection || selection.w < 0.01 || selection.h < 0.01) { setError('Drag over an area to blur first.'); return; }
    setBusy(true); setError(''); setPreview('');
    const inputUrl = URL.createObjectURL(file);
    try {
      const image = new Image(); image.src = inputUrl; await image.decode();
      if (image.naturalWidth * image.naturalHeight > 40_000_000) throw new Error('This image is over 40 megapixels. Resize it before editing.');
      const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d'); context.drawImage(image, 0, 0);
      context.save(); context.beginPath();
      context.rect(selection.x * canvas.width, selection.y * canvas.height, selection.w * canvas.width, selection.h * canvas.height);
      context.clip(); context.filter = `blur(${Math.max(12, Math.round(canvas.width * 0.012))}px)`; context.drawImage(image, 0, 0); context.restore();
      const blob = await new Promise((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Could not export this image.')), 'image/png'));
      setPreview(URL.createObjectURL(blob));
    } catch (cause) { setError(cause?.message || 'Could not blur the selected area.'); }
    finally { URL.revokeObjectURL(inputUrl); setBusy(false); }
  };
  const download = () => { if (!preview) return; downloadFileUrl(preview, `${file.name.replace(/\.[^.]+$/, '')}-blurred.png`); };

  return <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-9">
    <h2 className="text-2xl font-bold">Blur a selected area</h2>
    <p className="mb-6 mt-2 text-slate-500">Drag over a face, address, or other private detail to blur it. Selection is manual; no face detection is used.</p>
    <label className="block rounded-2xl border-2 border-dashed border-purple-200 p-7 text-center text-sm font-semibold text-purple-700">Choose image<input className="sr-only" type="file" accept="image/*" onChange={event => { setFile(event.target.files?.[0] || null); setSelection(null); setPreview(''); setError(''); }}/></label>
    {file && <div className="mt-5">
      <p className="mb-3 text-sm text-slate-600">{file.name} · Drag over the region to blur</p>
      <div className="relative mx-auto w-fit max-w-full touch-none select-none">
        <img ref={imageRef} src={sourceUrl} alt="Select area to blur" className="block max-h-[32rem] max-w-full rounded-lg object-contain" />
        <div className="absolute inset-0 cursor-crosshair" onPointerDown={startSelection} onPointerMove={updateSelection} onPointerUp={endSelection} onPointerCancel={endSelection}>
          {selection && <div className="pointer-events-none absolute border-2 border-purple-600 bg-purple-300/25" style={{ left: `${selection.x * 100}%`, top: `${selection.y * 100}%`, width: `${selection.w * 100}%`, height: `${selection.h * 100}%` }} />}
        </div>
      </div>
      <button disabled={busy} onClick={applyBlur} className="btn btn-primary mt-4 w-full disabled:opacity-50">{busy ? 'Blurring…' : 'Blur selected area'}</button>
    </div>}
    {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}
    {preview && <div className="mt-5"><img src={preview} alt="Blurred image preview" className="mx-auto max-h-[32rem] max-w-full rounded-xl object-contain"/><button onClick={download} className="btn btn-primary mt-4 w-full">Download image</button></div>}
  </div>;
}
