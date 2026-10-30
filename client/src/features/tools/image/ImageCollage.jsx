import { useEffect, useState } from 'react';
import ImageCollectionWorkspace from './ImageCollectionWorkspace';
import { downloadFileUrl } from '../../../utils/downloadFile';
import { useFile } from '../../../context/FileContext';

export default function ImageCollage() {
  const { activeFiles } = useFile();
  const [files, setFiles] = useState(() => activeFiles.filter(file => file.type.startsWith('image/')));
  const [columns, setColumns] = useState(2);
  const [gap, setGap] = useState(16);
  const [background, setBackground] = useState('#ffffff');
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const removeImage = index => { setFiles(current => current.filter((_, itemIndex) => itemIndex !== index)); setPreview(''); };

  const create = async () => {
    if (files.length < 2) { setError('Choose at least two images for a collage.'); return; }
    if (files.length > 40) { setError('Choose 40 images or fewer for one collage.'); return; }
    const gapSize = Number(gap);
    if (!Number.isInteger(gapSize) || gapSize < 0 || gapSize > 80) { setError('Spacing must be a whole number from 0 to 80.'); return; }

    setBusy(true); setError('');
    if (preview) { URL.revokeObjectURL(preview); setPreview(''); }
    const images = [];
    try {
      for (const file of files) {
        const url = URL.createObjectURL(file);
        try {
          const image = new Image(); image.src = url; await image.decode(); images.push(image);
        } finally { URL.revokeObjectURL(url); }
      }

      const columnCount = Math.min(Number(columns), images.length);
      const rows = Math.ceil(images.length / columnCount);
      const cell = 480;
      const canvas = document.createElement('canvas');
      canvas.width = columnCount * cell + (columnCount + 1) * gapSize;
      canvas.height = rows * cell + (rows + 1) * gapSize;
      const context = canvas.getContext('2d');
      context.fillStyle = background;
      context.fillRect(0, 0, canvas.width, canvas.height);

      images.forEach((image, index) => {
        const x = gapSize + (index % columnCount) * (cell + gapSize);
        const y = gapSize + Math.floor(index / columnCount) * (cell + gapSize);
        const scale = Math.min(cell / image.naturalWidth, cell / image.naturalHeight);
        const width = image.naturalWidth * scale;
        const height = image.naturalHeight * scale;
        context.drawImage(image, x + (cell - width) / 2, y + (cell - height) / 2, width, height);
      });

      const blob = await new Promise((resolve, reject) => canvas.toBlob(
        result => result ? resolve(result) : reject(new Error('Could not create the collage.')),
        'image/png',
      ));
      setPreview(URL.createObjectURL(blob));
    } catch (cause) { setError(cause?.message || 'Could not create the collage.'); }
    finally { setBusy(false); }
  };

  const download = () => {
    if (!preview) return;
    downloadFileUrl(preview, 'filewiz-collage.png');
  };

  return <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-9">
    <h2 className="text-2xl font-bold">Image collage maker</h2>
    <p className="mb-6 mt-2 text-slate-500">Combine photos into a clean grid. Images are processed on your device.</p>
    <label className="block rounded-2xl border-2 border-dashed border-purple-200 p-7 text-center text-sm font-semibold text-purple-700">Add images<input className="sr-only" type="file" accept="image/*" multiple onChange={event => { setFiles(current => [...current, ...Array.from(event.target.files || [])]); setPreview(''); setError(''); event.target.value = ''; }}/></label>
    {files.length > 0 && <div className="mt-5 space-y-4">
      <ImageCollectionWorkspace images={files} onImagesChange={next => { setFiles(next); setPreview(''); }} onRemove={removeImage} label="Collage item" />
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm">Columns<select className="mt-1 w-full rounded-xl border p-3" value={columns} onChange={event => { setColumns(event.target.value); setPreview(''); }}>{[1, 2, 3, 4].map(value => <option key={value}>{value}</option>)}</select></label>
        <label className="text-sm">Spacing (px)<input className="mt-1 w-full rounded-xl border p-3" type="number" min="0" max="80" value={gap} onChange={event => { setGap(event.target.value); setPreview(''); }}/></label>
        <label className="text-sm">Background<input className="mt-1 h-12 w-full rounded-xl border p-1" type="color" value={background} onChange={event => { setBackground(event.target.value); setPreview(''); }}/></label>
      </div>
      <button disabled={busy} onClick={create} className="btn btn-primary w-full disabled:opacity-50">{busy ? 'Creating…' : 'Create collage'}</button>
    </div>}
    {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}
    {preview && <div className="mt-6 rounded-xl bg-slate-50 p-4"><img src={preview} alt="Image collage preview" className="mx-auto max-h-[32rem] max-w-full rounded-lg object-contain"/><button onClick={download} className="btn btn-primary mt-4 w-full">Download collage</button></div>}
  </div>;
}
