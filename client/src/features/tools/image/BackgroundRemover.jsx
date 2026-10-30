import { useEffect, useRef, useState } from 'react';
import { downloadFile } from '../../../utils/downloadFile';
import AiBackgroundRemover from './AiBackgroundRemover';
import { useFile } from '../../../context/FileContext';

const MAX_PIXELS = 6_000_000;
const yieldToBrowser = () => new Promise(resolve => window.setTimeout(resolve, 0));

async function removeConnectedColor(imageData, target, tolerance, onProgress) {
  const { data, width, height } = imageData;
  const pixelCount = width * height;
  const queue = new Uint32Array(pixelCount);
  let readIndex = 0;
  let writeIndex = 0;
  const toleranceSquared = tolerance * tolerance;
  const matches = index => {
    const red = data[index] - target[0];
    const green = data[index + 1] - target[1];
    const blue = data[index + 2] - target[2];
    return red * red + green * green + blue * blue <= toleranceSquared * 3;
  };
  const add = pixel => {
    const index = pixel * 4;
    if (data[index + 3] > 0 && matches(index)) {
      data[index + 3] = 0;
      queue[writeIndex] = pixel;
      writeIndex += 1;
    }
  };

  for (let x = 0; x < width; x += 1) {
    add(x);
    add((height - 1) * width + x);
  }
  for (let y = 1; y < height - 1; y += 1) {
    add(y * width);
    add(y * width + width - 1);
  }

  while (readIndex < writeIndex) {
    const pixel = queue[readIndex++];
    const x = pixel % width;
    const y = Math.floor(pixel / width);
    if (x > 0) add(pixel - 1);
    if (x + 1 < width) add(pixel + 1);
    if (y > 0) add(pixel - width);
    if (y + 1 < height) add(pixel + width);
    if (readIndex % 120_000 === 0) {
      onProgress(Math.min(99, Math.round(readIndex / Math.max(writeIndex, 1) * 100)));
      await yieldToBrowser();
    }
  }
  onProgress(100);
}

function PlainBackgroundRemover({ initialFile }) {
  const [file, setFile] = useState(initialFile || null);
  const [imageUrl, setImageUrl] = useState('');
  const [targetColor, setTargetColor] = useState(null);
  const [tolerance, setTolerance] = useState(36);
  const [output, setOutput] = useState(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const samplerCanvas = useRef(null);

  useEffect(() => () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
  }, [imageUrl]);

  const chooseFile = selected => {
    setFile(selected);
    setImageUrl(selected ? URL.createObjectURL(selected) : '');
    setTargetColor(null);
    setOutput(null);
    setError('');
  };

  const sampleColor = event => {
    const image = event.currentTarget;
    const rect = image.getBoundingClientRect();
    const x = Math.max(0, Math.min(image.naturalWidth - 1, Math.floor((event.clientX - rect.left) * image.naturalWidth / rect.width)));
    const y = Math.max(0, Math.min(image.naturalHeight - 1, Math.floor((event.clientY - rect.top) * image.naturalHeight / rect.height)));
    const canvas = samplerCanvas.current;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    canvas.width = 1;
    canvas.height = 1;
    context.drawImage(image, x, y, 1, 1, 0, 0, 1, 1);
    const [red, green, blue] = context.getImageData(0, 0, 1, 1).data;
    setTargetColor([red, green, blue]);
    setOutput(null);
    setError('');
  };

  const removeBackground = async () => {
    if (!imageUrl || !targetColor) return;
    setBusy(true);
    setError('');
    setProgress(0);
    setOutput(null);
    try {
      const source = new Image();
      source.src = imageUrl;
      await source.decode();
      const width = source.naturalWidth;
      const height = source.naturalHeight;
      if (width * height > MAX_PIXELS) throw new Error('This image is larger than 6 megapixels. Resize it before removing its background on this device.');
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) throw new Error('Your browser could not open the image editor.');
      context.drawImage(source, 0, 0);
      const pixels = context.getImageData(0, 0, width, height);
      await removeConnectedColor(pixels, targetColor, tolerance, setProgress);
      context.putImageData(pixels, 0, 0);
      const blob = await new Promise((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Could not create a transparent PNG.')), 'image/png'));
      setOutput(blob);
    } catch (cause) {
      setError(cause?.message || 'Could not remove this background.');
    } finally {
      setBusy(false);
    }
  };

  const colorLabel = targetColor ? `rgb(${targetColor.join(', ')})` : '';

  return <div className="mx-auto max-w-4xl space-y-5 rounded-3xl border border-slate-200 bg-white p-5 sm:p-9">
    <header><h2 className="text-2xl font-bold">Background Remover</h2><p className="mt-2 text-slate-500">Remove a plain, connected background color locally. Tap or click the background color in the image to select it.</p></header>
    <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50/40 p-5 text-center font-semibold text-purple-800">{file ? file.name : 'Choose image'}<input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp,image/avif" onChange={event => chooseFile(event.target.files?.[0] || null)}/></label>
    {imageUrl && <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_220px]">
      <div className="flex min-h-48 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 p-2"><img src={imageUrl} alt="Click the background color to select it" onClick={sampleColor} className="max-h-[55vh] max-w-full cursor-crosshair object-contain"/></div>
      <div className="space-y-4">
        <div className="rounded-xl bg-slate-50 p-4 text-sm"><p className="font-semibold">Background color</p>{targetColor ? <p className="mt-1 flex items-center gap-2 text-slate-600"><span className="h-5 w-5 rounded-full border border-slate-300" style={{ backgroundColor: colorLabel }}/>{colorLabel}</p> : <p className="mt-1 text-slate-500">Tap the background in the preview.</p>}</div>
        <label className="block text-sm font-medium">Color tolerance: {tolerance}<input className="mt-2 w-full accent-purple-700" type="range" min="0" max="120" value={tolerance} onChange={event => { setTolerance(Number(event.target.value)); setOutput(null); }}/></label>
        <p className="text-xs text-slate-500">Higher tolerance removes more similar colors. Only color-connected pixels touching the image edge are removed.</p>
      </div>
    </div>}
    {targetColor && <button disabled={busy} onClick={removeBackground} className="btn btn-primary w-full disabled:opacity-50">{busy ? `Removing background… ${progress}%` : 'Remove background'}</button>}
    {output && <div className="rounded-xl bg-emerald-50 p-5"><p className="font-semibold text-emerald-800">Transparent PNG is ready.</p><button onClick={() => downloadFile(output, `${file.name.replace(/\.[^.]+$/, '') || 'image'}-no-background.png`)} className="btn btn-primary mt-3 w-full">Download PNG</button></div>}
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <p className="text-xs text-slate-500">Best for plain backgrounds. This is not AI segmentation and may not remove complex scenes, hair, or shadows. Images over 6 megapixels are blocked to help protect device memory.</p>
    <canvas ref={samplerCanvas} className="hidden" aria-hidden="true"/>
  </div>;
}

export default function BackgroundRemover() {
  const { activeFiles } = useFile();
  const initialFile = activeFiles.find(item => item.type.startsWith('image/')) || null;
  const [mode, setMode] = useState('ai');
  return <div className="mx-auto max-w-4xl space-y-4">
    <header>
      <h2 className="text-2xl font-bold">Background Remover</h2>
      <p className="mt-2 text-slate-500">Remove backgrounds with private on-device AI, or use the simple color picker for plain backgrounds.</p>
    </header>
    <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1" role="group" aria-label="Background removal method">
      <button type="button" aria-pressed={mode === 'ai'} onClick={() => setMode('ai')} className={`rounded-lg px-3 py-3 text-sm font-semibold ${mode === 'ai' ? 'bg-white text-purple-800 shadow-sm' : 'text-slate-600'}`}>AI portrait remover</button>
      <button type="button" aria-pressed={mode === 'plain'} onClick={() => setMode('plain')} className={`rounded-lg px-3 py-3 text-sm font-semibold ${mode === 'plain' ? 'bg-white text-purple-800 shadow-sm' : 'text-slate-600'}`}>Plain-color remover</button>
    </div>
    {mode === 'ai' ? <AiBackgroundRemover initialFile={initialFile} /> : <PlainBackgroundRemover initialFile={initialFile} />}
  </div>;
}
