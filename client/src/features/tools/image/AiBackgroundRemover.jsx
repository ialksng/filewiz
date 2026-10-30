import { useEffect, useState } from 'react';
import { downloadFile } from '../../../utils/downloadFile';

const MAX_PIXELS = 6_000_000;
const MAX_FILE_BYTES = 20 * 1024 * 1024;
let removerPromise;

function getRemover(setModelProgress) {
  if (!removerPromise) {
    removerPromise = import('@huggingface/transformers')
      .then(async ({ AutoModel, AutoProcessor, RawImage }) => {
        const modelId = 'onnx-community/BiRefNet_lite-ONNX';
        const model = await AutoModel.from_pretrained(modelId, {
          device: 'wasm',
          dtype: 'fp16',
          progress_callback: info => {
            if (info?.status === 'progress' && Number.isFinite(info.progress)) {
              setModelProgress(Math.round(info.progress));
            }
          },
        });
        const processor = await AutoProcessor.from_pretrained(modelId);
        return { model, processor, RawImage };
      })
      .catch(error => {
        removerPromise = null;
        throw error;
      });
  }
  return removerPromise;
}

async function imageDimensions(url) {
  const image = new Image();
  image.src = url;
  await image.decode();
  return { width: image.naturalWidth, height: image.naturalHeight };
}

async function canvasBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Could not create the transparent PNG.')), 'image/png');
  });
}

export default function AiBackgroundRemover({ initialFile = null }) {
  const [file, setFile] = useState(initialFile);
  const [imageUrl, setImageUrl] = useState('');
  const [output, setOutput] = useState(null);
  const [busy, setBusy] = useState(false);
  const [modelProgress, setModelProgress] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
  }, [imageUrl]);

  useEffect(() => () => {
    if (output?.url) URL.revokeObjectURL(output.url);
  }, [output?.url]);

  const chooseFile = selected => {
    if (selected && selected.size > MAX_FILE_BYTES) {
      setError('Choose an image smaller than 20 MB to protect memory on mobile devices.');
      return;
    }
    setError('');
    setFile(selected);
    setImageUrl(selected ? URL.createObjectURL(selected) : '');
    setOutput(null);
    setError('');
    setModelProgress(null);
  };

  const removeBackground = async () => {
    if (!file || !imageUrl) return;
    setBusy(true);
    setError('');
    setOutput(null);
    setModelProgress(null);
    try {
      const { width, height } = await imageDimensions(imageUrl);
      if (width * height > MAX_PIXELS) {
        throw new Error('This image is larger than 6 megapixels. Resize it before using AI removal on this device.');
      }
      const { model, processor, RawImage } = await getRemover(setModelProgress);
      const source = new Image();
      source.src = imageUrl;
      await source.decode();
      const sourceCanvas = document.createElement('canvas');
      sourceCanvas.width = width;
      sourceCanvas.height = height;
      const sourceContext = sourceCanvas.getContext('2d', { willReadFrequently: true });
      if (!sourceContext) throw new Error('This browser could not prepare the image.');
      sourceContext.drawImage(source, 0, 0);
      const pixels = sourceContext.getImageData(0, 0, width, height);
      const rawImage = new RawImage(pixels.data, width, height, 4);
      const { pixel_values } = await processor(rawImage);
      const { output_image } = await model({ input_image: pixel_values });
      if (!output_image?.[0]) throw new Error('The AI model could not create a usable mask.');
      const mask = await RawImage.fromTensor(output_image[0].sigmoid().mul(255).to('uint8')).resize(width, height);
      rawImage.rgba().putAlpha(mask.grayscale());
      const blob = await canvasBlob(rawImage.toCanvas());
      setOutput({ blob, url: URL.createObjectURL(blob) });
    } catch (cause) {
      setError(cause?.message || 'AI background removal failed. Try the plain-background tool below.');
    } finally {
      setBusy(false);
    }
  };

  const baseName = file?.name.replace(/\.[^.]+$/, '') || 'image';

  return <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
      <p className="font-semibold">Private, on-device AI</p>
      <p className="mt-1">Your image stays on this device. First use downloads the browser AI runtime and a higher-quality general image model (about 115 MB) from Hugging Face. The download does not include your image. Results can vary with hair, transparent objects, and busy backgrounds.</p>
    </div>
    <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50/40 p-5 text-center font-semibold text-purple-800">
      {file ? file.name : 'Choose an image or product photo'}
      <input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp,image/avif" onChange={event => chooseFile(event.target.files?.[0] || null)} />
    </label>
    {imageUrl && <div className="grid gap-4 sm:grid-cols-2">
      <figure className="min-w-0 rounded-xl border border-slate-200 p-3">
        <figcaption className="mb-2 text-center text-sm font-semibold text-slate-600">Original</figcaption>
        <div className="flex min-h-40 items-center justify-center overflow-hidden rounded-lg bg-slate-100 p-2"><img src={imageUrl} alt="Original image preview" className="max-h-[45vh] max-w-full object-contain" /></div>
      </figure>
      {output && <figure className="min-w-0 rounded-xl border border-slate-200 p-3">
        <figcaption className="mb-2 text-center text-sm font-semibold text-slate-600">Transparent background</figcaption>
        <div className="flex min-h-40 items-center justify-center overflow-hidden rounded-lg bg-[linear-gradient(45deg,#e2e8f0_25%,transparent_25%,transparent_75%,#e2e8f0_75%),linear-gradient(45deg,#e2e8f0_25%,white_25%,white_75%,#e2e8f0_75%)] bg-[length:24px_24px] bg-[position:0_0,12px_12px] p-2"><img src={output.url} alt="Image with background removed" className="max-h-[45vh] max-w-full object-contain" /></div>
      </figure>}
    </div>}
    {file && !output && <button type="button" disabled={busy} onClick={removeBackground} className="btn btn-primary w-full disabled:opacity-50">
      {busy ? modelProgress == null ? 'Loading AI model…' : `Loading AI model… ${modelProgress}%` : 'Remove background with AI'}
    </button>}
    {busy && <p role="status" className="text-center text-sm text-slate-500">First use downloads the browser runtime and model. AI processing may take a little longer on phones.</p>}
    {output && <div className="rounded-xl bg-emerald-50 p-4">
      <p className="font-semibold text-emerald-800">Your transparent PNG is ready.</p>
      <button type="button" onClick={() => downloadFile(output.blob, `${baseName}-background-removed.png`)} className="btn btn-primary mt-3 w-full">Download PNG</button>
    </div>}
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <p className="text-xs text-slate-500">Runs locally using <a href="https://huggingface.co/onnx-community/BiRefNet_lite-ONNX" target="_blank" rel="noreferrer" className="underline">BiRefNet Lite (MIT)</a>. Images over 20 MB or 6 megapixels are blocked to help protect mobile device memory. The local plain-color remover below is available as a fallback.</p>
  </div>;
}
