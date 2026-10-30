import { useEffect, useState } from 'react';

function useImageUrl(value) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    if (!value) { setUrl(''); return undefined; }
    if (typeof value === 'string') { setUrl(value); return undefined; }
    const objectUrl = URL.createObjectURL(value);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [value]);
  return url;
}

export default function ImagePreviewWorkspace({ source, output, outputLabel = 'Edited image' }) {
  const sourceUrl = useImageUrl(source);
  const outputUrl = useImageUrl(output);
  return <section className="rounded-2xl border border-slate-200 bg-[#f5f5fa] p-3 sm:p-4" aria-label="Image preview workspace">
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <h3 className="font-bold text-slate-800">Image workspace</h3>
      {source && <span className="max-w-[60%] truncate text-xs text-slate-500" title={source.name}>{source.name}</span>}
    </div>
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-2">
        <p className="mb-2 px-1 text-xs font-semibold text-slate-600">Original</p>
        <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg bg-slate-50">
          {sourceUrl ? <img src={sourceUrl} alt="Original image" className="h-full w-full object-contain" /> : <span className="text-xs text-slate-400">Choose an image to preview.</span>}
        </div>
      </div>
      <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-2">
        <p className="mb-2 px-1 text-xs font-semibold text-slate-600">{outputLabel}</p>
        <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg bg-slate-50">
          {outputUrl ? <img src={outputUrl} alt={outputLabel} className="h-full w-full object-contain" /> : <span className="px-3 text-center text-xs text-slate-400">Your result preview will appear here.</span>}
        </div>
      </div>
    </div>
  </section>;
}
