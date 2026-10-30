import { useState, useRef } from 'react';
import { useFile } from '../../../context/FileContext';
import { mergePdfs } from '../../../services/pdfEngine';
import { downloadFile } from '../../../utils/downloadFile';
import SaveToDriveButton from '../../../components/SaveToDriveButton';

export default function MergePdf() {
  const { activeFiles, setActiveFiles, clearFiles } = useFile();
  const fileInputRef = useRef(null);

  const [filesList, setFilesList] = useState(activeFiles || []);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [mergedBlob, setMergedBlob] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleUpload = (e) => {
    setErrorMsg(null);
    const added = Array.from(e.target.files).filter(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
    if (added.length > 0) {
      const updated = [...filesList, ...added];
      setFilesList(updated);
      setActiveFiles(updated);
    }
  };

  const removeFile = (idx) => {
    const updated = filesList.filter((_, i) => i !== idx);
    setFilesList(updated);
    setActiveFiles(updated);
  };

  const moveFile = (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= filesList.length) return;
    const updated = [...filesList];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    setFilesList(updated);
    setActiveFiles(updated);
  };

  const handleMerge = async () => {
    if (filesList.length < 2) {
      setErrorMsg('Please select at least 2 PDF files to merge.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const mergedBytes = await mergePdfs(filesList);
      const blob = new Blob([mergedBytes], { type: 'application/pdf' });
      setMergedBlob(blob);
      setIsCompleted(true);
    } catch (err) {
      console.error('Merge error:', err);
      setErrorMsg(err.message || 'Failed to merge PDF files.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!mergedBlob) return;
    await downloadFile(mergedBlob, 'merged_document.pdf');
  };

  if (isCompleted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in zoom-in duration-300 bg-white rounded-3xl border border-slate-200 shadow-sm max-w-3xl mx-auto p-8">
        <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6 text-4xl">
          ✓
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">PDFs Merged Successfully!</h1>
        <p className="text-slate-500 mb-8 max-w-md mx-auto">
          {filesList.length} PDF files were combined into one document.
        </p>

        <button 
          onClick={handleDownload}
          className="btn btn-primary py-4 px-10 rounded-xl text-lg flex items-center gap-3 shadow-lg shadow-purple-200"
        >
          <span>⬇️</span>
          Download Merged PDF
        </button>
        <SaveToDriveButton className="mt-3 max-w-sm" blob={mergedBlob} filename="merged_document.pdf" />

        <button 
          onClick={() => {
            clearFiles();
            setFilesList([]);
            setIsCompleted(false);
            setMergedBlob(null);
          }}
          className="mt-6 text-slate-500 hover:text-slate-800 font-medium transition-colors text-sm"
        >
          Merge more files
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300 max-w-6xl mx-auto sm:pb-0">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Merge PDF Files</h1>
        <p className="text-slate-500 mt-1">Combine multiple PDFs into a single document in any order.</p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          {errorMsg}
        </div>
      )}

      {filesList.length === 0 ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="bg-white border-2 border-dashed border-purple-300 rounded-3xl p-8 sm:p-16 text-center hover:bg-purple-50 hover:border-purple-500 transition-all duration-300 cursor-pointer group shadow-sm hover:shadow-md"
        >
          <input 
            type="file" 
            accept=".pdf,application/pdf" 
            multiple 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleUpload} 
          />
          <span className="text-6xl mb-6 block group-hover:scale-110 transition-transform duration-300">📑</span>
          <h3 className="text-2xl font-bold text-slate-800 mb-2">Select 2 or more PDF files</h3>
          <p className="text-slate-500">or drop them here</p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(18rem,0.85fr)] lg:items-stretch">
          <section className="min-w-0 rounded-2xl border border-slate-200 bg-[#f5f5fa] p-4 sm:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-bold text-slate-800">Selected documents ({filesList.length})</h3>
              <input type="file" accept=".pdf,application/pdf" multiple className="hidden" ref={fileInputRef} onChange={handleUpload} />
              <button onClick={() => fileInputRef.current?.click()} className="min-h-11 rounded-lg px-3 text-sm font-semibold text-purple-700 hover:bg-purple-50">
                + Add more files
              </button>
            </div>

            <div className="space-y-3">
            {filesList.map((file, idx) => (
              <div key={`${file.name}-${file.size}-${idx}`} className="flex min-w-0 items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-white p-3 sm:p-3.5 shadow-sm">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-xl">📄</span>
                  <div className="overflow-hidden">
                    <p className="truncate font-medium text-sm text-slate-800">{file.name}</p>
                    <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                  <button 
                    disabled={idx === 0} 
                    onClick={() => moveFile(idx, idx - 1)}
                    className="min-h-10 min-w-10 rounded-lg p-1 text-slate-500 hover:bg-purple-50 hover:text-purple-600 disabled:opacity-30"
                    title="Move up"
                    aria-label={`Move ${file.name} up`}
                  >
                    ▲
                  </button>
                  <button 
                    disabled={idx === filesList.length - 1} 
                    onClick={() => moveFile(idx, idx + 1)}
                    className="min-h-10 min-w-10 rounded-lg p-1 text-slate-500 hover:bg-purple-50 hover:text-purple-600 disabled:opacity-30"
                    title="Move down"
                    aria-label={`Move ${file.name} down`}
                  >
                    ▼
                  </button>
                  <button 
                    onClick={() => removeFile(idx)}
                    className="ml-1 min-h-10 min-w-10 rounded-lg p-1 text-slate-500 hover:bg-red-50 hover:text-red-500"
                    title="Remove file"
                    aria-label={`Remove ${file.name}`}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
            </div>
          </section>

          <aside className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-bold text-slate-900">Merge PDF</h2>
            <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-slate-700">
              <span className="mr-2 text-sky-600" aria-hidden="true">ⓘ</span>
              Change the order of your PDFs with the up and down controls. The first file will appear first in the merged document.
            </div>
            <p className="mt-4 text-sm text-slate-500">Your files are processed in this browser and stay on your device.</p>
            <button
              onClick={handleMerge}
              disabled={isProcessing || filesList.length < 2}
              className="btn btn-primary fixed inset-x-4 bottom-3 z-20 mt-0 w-auto justify-center rounded-xl py-4 text-lg shadow-lg disabled:opacity-50 sm:static sm:inset-auto sm:z-auto sm:mt-auto sm:w-full"
            >
              {isProcessing ? (
                <>
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Merging PDFs...
                </>
              ) : `Merge ${filesList.length} PDFs`}
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}
