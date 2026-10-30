import { useEffect, useRef, useState } from 'react';
import { cropImage, resizeImage, transformImage } from '../../../services/imageEngine';
import { useFile } from '../../../context/FileContext';
import { downloadFile } from '../../../utils/downloadFile';
import ImagePreviewWorkspace from './ImagePreviewWorkspace';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function CropSelector({ file, region, setRegion, shape, setShape }) {
  const imageRef = useRef(null);
  const dragRef = useRef(null);
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0, naturalWidth: 0, naturalHeight: 0 });
  const [sourceUrl, setSourceUrl] = useState('');

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSourceUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const position = (event) => {
    const bounds = imageRef.current.getBoundingClientRect();
    return {
      bounds,
      x: clamp((event.clientX - bounds.left) / bounds.width, 0, 1),
      y: clamp((event.clientY - bounds.top) / bounds.height, 0, 1),
    };
  };

  const begin = (event) => {
    if (!imageRef.current) return;
    event.preventDefault();
    const { x, y, bounds } = position(event);
    const action = event.target.closest('[data-crop-action]')?.dataset.cropAction || 'draw';
    dragRef.current = { action, x, y, bounds, initial: region };
    event.currentTarget.setPointerCapture(event.pointerId);
    if (action === 'draw') setRegion({ x, y, w: 0.02, h: 0.02 });
  };

  const move = (event) => {
    const drag = dragRef.current;
    if (!drag) return;
    const { x, y } = position(event);
    const dx = x - drag.x;
    const dy = y - drag.y;
    if (drag.action === 'move') {
      const current = drag.initial;
      setRegion({ ...current, x: clamp(current.x + dx, 0, 1 - current.w), y: clamp(current.y + dy, 0, 1 - current.h) });
      return;
    }
    const xDelta = dx * drag.bounds.width;
    const yDelta = dy * drag.bounds.height;
    if (drag.action.startsWith('resize-')) {
      const corner = drag.action.slice('resize-'.length);
      const left = drag.initial.x * drag.bounds.width;
      const top = drag.initial.y * drag.bounds.height;
      const right = left + drag.initial.w * drag.bounds.width;
      const bottom = top + drag.initial.h * drag.bounds.height;
      const anchorX = corner.includes('w') ? right : left;
      const anchorY = corner.includes('n') ? bottom : top;
      const pointerX = x * drag.bounds.width;
      const pointerY = y * drag.bounds.height;
      if (shape === 'square') {
        const maxX = corner.includes('w') ? anchorX : drag.bounds.width - anchorX;
        const maxY = corner.includes('n') ? anchorY : drag.bounds.height - anchorY;
        const side = clamp((Math.abs(pointerX - anchorX) + Math.abs(pointerY - anchorY)) / 2, 12, Math.max(12, Math.min(maxX, maxY)));
        const nextLeft = corner.includes('w') ? anchorX - side : anchorX;
        const nextTop = corner.includes('n') ? anchorY - side : anchorY;
        setRegion({ x: nextLeft / drag.bounds.width, y: nextTop / drag.bounds.height, w: side / drag.bounds.width, h: side / drag.bounds.height });
      } else {
        const nextX = clamp(pointerX, 0, drag.bounds.width);
        const nextY = clamp(pointerY, 0, drag.bounds.height);
        setRegion({ x: Math.min(anchorX, nextX) / drag.bounds.width, y: Math.min(anchorY, nextY) / drag.bounds.height, w: Math.abs(nextX - anchorX) / drag.bounds.width, h: Math.abs(nextY - anchorY) / drag.bounds.height });
      }
      return;
    }
    if (shape === 'square') {
      const side = Math.max(12, Math.min(Math.abs(xDelta), Math.abs(yDelta), drag.bounds.width, drag.bounds.height));
      const directionX = xDelta < 0 ? -1 : 1;
      const directionY = yDelta < 0 ? -1 : 1;
      const startX = drag.x * drag.bounds.width;
      const startY = drag.y * drag.bounds.height;
      const left = clamp(directionX < 0 ? startX - side : startX, 0, drag.bounds.width - side);
      const top = clamp(directionY < 0 ? startY - side : startY, 0, drag.bounds.height - side);
      setRegion({ x: left / drag.bounds.width, y: top / drag.bounds.height, w: side / drag.bounds.width, h: side / drag.bounds.height });
      return;
    }
    const startX = drag.x;
    const startY = drag.y;
    const endX = drag.x + dx;
    const endY = drag.y + dy;
    setRegion({ x: Math.min(startX, endX), y: Math.min(startY, endY), w: Math.abs(endX - startX), h: Math.abs(endY - startY) });
  };

  return <div className="rounded-2xl border border-slate-200 bg-slate-950 p-3 sm:p-5">
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-white">
      <div><p className="text-sm font-semibold">Select the part you want to keep</p><p className="mt-1 text-xs text-white/70">Drag on the image to select. Drag inside the box to move it.</p></div>
      <div className="flex rounded-xl bg-white/10 p-1" role="group" aria-label="Crop shape">
        {['square', 'free'].map((option) => <button key={option} type="button" aria-pressed={shape === option} onClick={() => {
          setShape(option);
          if (option === 'square' && imageRef.current) {
            const bounds = imageRef.current.getBoundingClientRect();
            const side = Math.min(region.w * bounds.width, region.h * bounds.height);
            const width = side / bounds.width;
            const height = side / bounds.height;
            setRegion({ x: clamp(region.x + (region.w - width) / 2, 0, 1 - width), y: clamp(region.y + (region.h - height) / 2, 0, 1 - height), w: width, h: height });
          }
        }} className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize ${shape === option ? 'bg-white text-slate-900' : 'text-white'}`}>{option === 'free' ? 'Free form' : '1:1 Square'}</button>)}
      </div>
    </div>
    <div className="flex max-h-[65vh] min-h-48 touch-none select-none items-center justify-center overflow-hidden" onPointerDown={begin} onPointerMove={move} onPointerUp={() => { dragRef.current = null; }} onPointerCancel={() => { dragRef.current = null; }}>
      <div className="relative inline-block max-h-[65vh] max-w-full leading-none">
        {sourceUrl && <img ref={imageRef} src={sourceUrl} alt="Select the part of the image to crop" className="block max-h-[65vh] max-w-full object-contain" onLoad={(event) => {
          const { clientWidth: width, clientHeight: height } = event.currentTarget;
          setDisplaySize({ width, height, naturalWidth: event.currentTarget.naturalWidth, naturalHeight: event.currentTarget.naturalHeight });
          if (shape === 'square') {
            const side = Math.min(width, height) * 0.72;
            setRegion({ x: (width - side) / 2 / width, y: (height - side) / 2 / height, w: side / width, h: side / height });
          }
        }} />}
        {region && <div data-crop-action="move" className="absolute cursor-move border-[3px] border-amber-300 bg-amber-200/10 shadow-[0_0_0_9999px_rgba(0,0,0,.62)]" style={{ left: `${region.x * 100}%`, top: `${region.y * 100}%`, width: `${region.w * 100}%`, height: `${region.h * 100}%` }}>
          <span className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3"><i className="border-b border-r border-white/65"/><i className="border-b border-r border-white/65"/><i className="border-b border-white/65"/><i className="border-b border-r border-white/65"/><i className="border-b border-r border-white/65"/><i className="border-b border-white/65"/><i className="border-r border-white/65"/><i className="border-r border-white/65"/><i/></span>
          <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-black/75 px-2.5 py-1.5 text-xs font-bold text-white shadow">Keep this area</span>
          {['nw', 'ne', 'sw', 'se'].map(corner => <span key={corner} data-crop-action={`resize-${corner}`} className={`absolute z-10 h-5 w-5 touch-none rounded-full border-2 border-slate-950 bg-amber-300 shadow-md ${corner.includes('n') ? '-top-2.5' : '-bottom-2.5'} ${corner.includes('w') ? '-left-2.5' : '-right-2.5'}`} style={{ cursor: corner === 'nw' || corner === 'se' ? 'nwse-resize' : 'nesw-resize' }} aria-label={`Resize crop from ${corner}`} />)}
        </div>}
      </div>
    </div>
    {displaySize.width > 0 && <p className="mt-3 text-center text-xs font-medium text-white/80">{Math.round(region.w * displaySize.naturalWidth)} × {Math.round(region.h * displaySize.naturalHeight)} px selected · Drag any corner to resize</p>}
  </div>;
}

export default function ImageTransform({ mode = 'resize' }) {
  const { activeFiles } = useFile();
  const [file, setFile] = useState(() => activeFiles.find((item) => item.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp|avif)$/i.test(item.name)) || null);
  const [width, setWidth] = useState(1200);
  const [height, setHeight] = useState(800);
  const [rotation, setRotation] = useState(90);
  const [fit, setFit] = useState('contain');
  const [shape, setShape] = useState('square');
  const [region, setRegion] = useState({ x: 0.15, y: 0.15, w: 0.7, h: 0.7 });
  const [output, setOutput] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const title = mode === 'crop' ? 'Crop image' : mode === 'rotate' ? 'Rotate image' : 'Resize image';

  const selectFile = (selected) => {
    setFile(selected);
    setOutput(null);
    setError('');
    setRegion({ x: 0.15, y: 0.15, w: 0.7, h: 0.7 });
  };

  const process = async () => {
    if (!file) return;
    setBusy(true); setError(''); setOutput(null);
    try {
      let blob;
      if (mode === 'rotate') blob = await transformImage(file, { rotation: Number(rotation) });
      else if (mode === 'crop') {
        const image = new Image();
        const sourceUrl = URL.createObjectURL(file);
        try {
          await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; image.src = sourceUrl; });
        } finally { URL.revokeObjectURL(sourceUrl); }
        if (!region.w || !region.h) throw new Error('Drag on the image to select a crop area.');
        blob = await cropImage(file, { x: region.x * image.naturalWidth, y: region.y * image.naturalHeight, width: region.w * image.naturalWidth, height: region.h * image.naturalHeight });
      } else {
        const targetWidth = Number(width); const targetHeight = Number(height);
        if (!Number.isInteger(targetWidth) || !Number.isInteger(targetHeight) || targetWidth < 1 || targetHeight < 1 || targetWidth > 10000 || targetHeight > 10000 || targetWidth * targetHeight > 25_000_000) {
          throw new Error('Enter whole-number dimensions under 10,000 px and 25 megapixels total.');
        }
        blob = await resizeImage(file, { width: targetWidth, height: targetHeight, fit });
      }
      setOutput(blob);
    } catch (cause) { setError(cause?.message || `Could not ${title.toLowerCase()}.`); }
    finally { setBusy(false); }
  };

  const download = async () => {
    if (!output) return;
    const extension = output.type.split('/')[1] === 'jpeg' ? 'jpg' : output.type.split('/')[1] || 'png';
    await downloadFile(output, `${file.name.replace(/\.[^.]+$/, '')}-${mode}.${extension}`);
  };

  return <div className="mx-auto max-w-6xl space-y-5">
    <header><h2 className="text-2xl font-bold">{title}</h2><p className="mt-2 text-slate-500">Adjust your image and compare the original with your result.</p></header>
    {!file ? <label className="block cursor-pointer rounded-3xl border-2 border-dashed border-purple-300 bg-white p-8 text-center text-sm font-semibold text-purple-700 shadow-sm sm:p-12">Choose image<input className="sr-only" type="file" accept="image/*" onChange={event => selectFile(event.target.files?.[0] || null)}/></label> : <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)]">
      <div className="space-y-4">{mode === 'crop' ? <CropSelector file={file} region={region} setRegion={setRegion} shape={shape} setShape={setShape}/> : <ImagePreviewWorkspace source={file} output={output} outputLabel="Result"/>}</div>
      <aside className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3"><p className="truncate text-sm font-semibold text-slate-700" title={file.name}>{file.name}</p><button type="button" onClick={() => selectFile(null)} className="min-h-10 shrink-0 rounded-lg px-3 text-xs font-semibold text-red-600 hover:bg-red-50">Change</button></div>
        {mode === 'rotate' ? <label className="block text-sm">Rotation<select className="mt-1 w-full rounded-xl border p-3" value={rotation} onChange={event => { setRotation(event.target.value); setOutput(null); }}><option value="90">90° clockwise</option><option value="180">180°</option><option value="270">270° clockwise</option></select></label> : mode === 'resize' ? <>
          <div className="grid grid-cols-2 gap-3"><label className="text-sm">Width (px)<input className="mt-1 w-full rounded-xl border p-3" type="number" value={width} min="1" max="10000" onChange={event => { setWidth(event.target.value); setOutput(null); }}/></label><label className="text-sm">Height (px)<input className="mt-1 w-full rounded-xl border p-3" type="number" value={height} min="1" max="10000" onChange={event => { setHeight(event.target.value); setOutput(null); }}/></label></div>
          <label className="mt-3 block text-sm">Fit<select className="mt-1 w-full rounded-xl border p-3" value={fit} onChange={event => { setFit(event.target.value); setOutput(null); }}><option value="contain">Contain without cropping</option><option value="cover">Fill and crop</option><option value="stretch">Stretch to exact dimensions</option></select></label>
        </> : <p className="text-sm text-slate-600">Crop to a square or draw a free-form selection. Your crop keeps as much original detail as the browser can safely process.</p>}
        {mode === 'crop' && output && <div className="mt-4"><ImagePreviewWorkspace source={file} output={output} outputLabel="Cropped result"/></div>}
        {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {output ? <button onClick={download} className="btn btn-primary mt-5 w-full">Download image</button> : <button disabled={busy} onClick={process} className="btn btn-primary mt-5 w-full disabled:opacity-50">{busy ? 'Processing…' : title}</button>}
      </aside>
    </div>}
  </div>;
}
