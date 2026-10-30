import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import SaveToDriveButton from './SaveToDriveButton';

export default function DriveSaveToast() {
  const [download, setDownload] = useState(null);

  useEffect(() => {
    const handleDownload = (event) => setDownload(event.detail || null);
    window.addEventListener('filewiz:download-ready', handleDownload);
    return () => window.removeEventListener('filewiz:download-ready', handleDownload);
  }, []);

  if (!download?.blob || !download.filename) return null;

  return (
    <aside className="fixed bottom-4 left-4 right-4 z-[90] mx-auto flex max-w-lg items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl sm:bottom-6 sm:left-auto sm:right-6" aria-label="Save downloaded file">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-800">{download.filename}</p>
        <SaveToDriveButton className="mt-2" blob={download.blob} filename={download.filename} />
      </div>
      <button type="button" onClick={() => setDownload(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Dismiss Google Drive save option">
        <X size={18} />
      </button>
    </aside>
  );
}
