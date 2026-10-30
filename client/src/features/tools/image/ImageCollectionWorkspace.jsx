import { useEffect, useState } from 'react';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, useSortable, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

let nextFileId = 1;
const fileIds = new WeakMap();
const getFileId = file => {
  if (!fileIds.has(file)) fileIds.set(file, `image-${nextFileId++}`);
  return fileIds.get(file);
};

function SortableImage({ file, index, onRemove, label }) {
  const [preview, setPreview] = useState('');
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: getFileId(file) });
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 2 : undefined };

  return <article ref={setNodeRef} style={style} className={`min-w-0 rounded-xl border bg-white p-2 shadow-sm ${isDragging ? 'border-purple-400 shadow-lg' : 'border-slate-200'}`}>
    <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-slate-100">
      {preview && <img src={preview} alt={file.name} className="h-full w-full object-contain" />}
      <button type="button" {...attributes} {...listeners} aria-label={`Drag ${file.name} to change order`} className="absolute left-2 top-2 flex h-10 w-10 touch-none items-center justify-center rounded-lg border border-slate-200 bg-white/95 text-lg text-slate-700 shadow-sm" title="Drag to reorder">⠿</button>
      {onRemove && <button type="button" onClick={() => onRemove(index)} aria-label={`Remove ${file.name}`} className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white/95 text-slate-600 shadow-sm hover:text-red-600">×</button>}
    </div>
    <div className="px-1 pb-1 pt-2">
      <p className="text-xs font-semibold text-slate-700">{label} {index + 1}</p>
      <p className="truncate text-xs text-slate-500" title={file.name}>{file.name}</p>
      <p className="text-[11px] text-slate-400">{(file.size / 1024).toFixed(0)} KB</p>
    </div>
  </article>;
}

export default function ImageCollectionWorkspace({ images, onImagesChange, onRemove, label = 'Image' }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const from = images.findIndex(file => getFileId(file) === active.id);
    const to = images.findIndex(file => getFileId(file) === over.id);
    if (Number.isInteger(from) && Number.isInteger(to)) onImagesChange(arrayMove(images, from, to));
  };
  const ids = images.map(getFileId);

  return <section className="rounded-2xl border border-slate-200 bg-[#f5f5fa] p-4 sm:p-6" aria-label={`${label} workspace`}>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <div>
        <h2 className="font-bold text-slate-900">{label} workspace</h2>
        <p className="mt-1 text-xs text-slate-500">Drag the grip to arrange the final order.</p>
      </div>
      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">{images.length} {images.length === 1 ? 'image' : 'images'}</span>
    </div>
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-2 gap-3 min-[480px]:grid-cols-3 sm:grid-cols-4">
          {images.map((file, index) => <SortableImage key={getFileId(file)} file={file} index={index} label={label} onRemove={onRemove} />)}
        </div>
      </SortableContext>
    </DndContext>
  </section>;
}
