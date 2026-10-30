import { useEffect, useMemo, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href;

function SortablePage({ pageNumber, imageUrl, selected, selectable, reorderable, onToggle }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: pageNumber });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 2 : undefined };

  return (
    <article ref={setNodeRef} style={style} className={`min-w-0 rounded-xl border bg-white p-2 shadow-sm ${isDragging ? 'border-purple-400 shadow-lg' : selected ? 'border-purple-400 ring-2 ring-purple-100' : 'border-slate-200'}`}>
      <div className="relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-lg bg-slate-100">
        {imageUrl ? <img src={imageUrl} alt={`Page ${pageNumber}`} className="h-full w-full object-contain" /> : <span className="text-xs text-slate-400">Loading…</span>}
        {reorderable && <button type="button" {...attributes} {...listeners} aria-label={`Drag page ${pageNumber} to reorder`} className="absolute right-1 top-1 flex h-9 w-9 touch-none items-center justify-center rounded-lg border border-slate-200 bg-white/95 text-lg text-slate-600 shadow-sm" title="Drag to reorder">⠿</button>}
      </div>
      <div className="mt-2 flex items-center justify-between gap-1">
        <span className="truncate text-xs font-semibold text-slate-700">Page {pageNumber}</span>
        {selectable && <button type="button" aria-pressed={selected} onClick={() => onToggle(pageNumber)} className={`min-h-9 rounded-lg px-2 text-xs font-semibold ${selected ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-600 hover:bg-purple-50'}`}>
          {selected ? 'Selected' : 'Select'}
        </button>}
      </div>
    </article>
  );
}

export default function PdfPageWorkspace({ file, pages, onPagesChange, selectedPages = [], onSelectedPagesChange, selectionLabel = 'Select pages', reorderable = true }) {
  const [thumbnails, setThumbnails] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const selectedSet = useMemo(() => new Set(selectedPages), [selectedPages]);

  useEffect(() => {
    let cancelled = false;
    const urls = [];
    const renderPages = async () => {
      setThumbnails({});
      setError('');
      if (!file) return;
      setLoading(true);
      try {
        const document = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
        if (document.numPages > 200) throw new Error('For performance, page previews are limited to PDFs with 200 pages or fewer.');
        const next = {};
        for (let number = 1; number <= document.numPages; number += 1) {
          if (cancelled) return;
          const page = await document.getPage(number);
          const viewport = page.getViewport({ scale: 0.42 });
          const canvas = window.document.createElement('canvas');
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          await page.render({ canvas, canvasContext: canvas.getContext('2d'), viewport }).promise;
          const blob = await new Promise((resolve, reject) => canvas.toBlob(result => result ? resolve(result) : reject(new Error(`Could not preview page ${number}.`)), 'image/jpeg', 0.78));
          const url = URL.createObjectURL(blob);
          urls.push(url);
          next[number] = url;
          canvas.width = 0;
          canvas.height = 0;
        }
        if (!cancelled) setThumbnails(next);
      } catch (cause) {
        if (!cancelled) setError(cause?.message || 'Could not create page previews for this PDF.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    renderPages();
    return () => {
      cancelled = true;
      urls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [file]);

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const from = pages.indexOf(active.id);
    const to = pages.indexOf(over.id);
    if (from >= 0 && to >= 0) onPagesChange(arrayMove(pages, from, to));
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-[#f5f5fa] p-4 sm:p-6" aria-label="PDF page workspace">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-bold text-slate-900">Page workspace</h2>
          <p className="mt-1 text-xs text-slate-500">{reorderable ? 'Drag the grip to arrange pages' : 'Tap pages to select them'}{onSelectedPagesChange ? ` · ${selectionLabel}` : ''}.</p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">{pages.length} {pages.length === 1 ? 'page' : 'pages'}</span>
      </div>
      {loading && <p aria-live="polite" className="mb-3 text-sm text-slate-500">Preparing page previews…</p>}
      {error && <p role="alert" className="mb-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{error}</p>}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={pages} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 gap-3 min-[480px]:grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {pages.map(pageNumber => <SortablePage key={pageNumber} pageNumber={pageNumber} imageUrl={thumbnails[pageNumber]} selected={selectedSet.has(pageNumber)} selectable={Boolean(onSelectedPagesChange)} reorderable={reorderable} onToggle={page => onSelectedPagesChange(selectedSet.has(page) ? selectedPages.filter(value => value !== page) : [...selectedPages, page])} />)}
          </div>
        </SortableContext>
      </DndContext>
    </section>
  );
}
