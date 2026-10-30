import { useState, useRef } from 'react';
import { useFile } from '../../../context/FileContext';
import { compressPdf } from '../../../services/pdfEngine';
import { downloadFile } from '../../../utils/downloadFile';
import SaveToDriveButton from '../../../components/SaveToDriveButton';

export default function CompressPdf() {
  const { activeFiles, setActiveFiles, clearFiles } = useFile();
  const fileInputRef = useRef(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [compressedFileBlob, setCompressedFileBlob] = useState(null);
  const [originalSize, setOriginalSize] = useState(0);
  const [newSize, setNewSize] = useState(0);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleLocalUpload = (e) => {
    setErrorMsg(null);
    const files = Array.from(e.target.files).filter(file => file.type === 'application/pdf' || file.name.endsWith('.pdf'));
    if (files.length > 0) {
      setActiveFiles(files);
      setOriginalSize(files[0].size);
    }
  };

  const handleCompress = async () => {
    if (!activeFiles || activeFiles.length === 0) return;
    
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const fileToCompress = activeFiles[0];
      setOriginalSize(fileToCompress.size);
      
      const compressedBytes = await compressPdf(fileToCompress);
      const blob = new Blob([compressedBytes], { type: 'application/pdf' });
      
      setCompressedFileBlob(blob);
      setNewSize(blob.size);
      setIsCompleted(true);
    } catch (err) {
      console.error("Compression error:", err);
      setErrorMsg(err.message || 'Failed to compress PDF. Please make sure the file is not corrupted.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!compressedFileBlob) return;
    const originalName = activeFiles[0]?.name.replace(/\.pdf$/i, '') || 'document';
    await downloadFile(compressedFileBlob, `${originalName}_compressed.pdf`);
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  // 1. Empty state
  if (!activeFiles || activeFiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 animate-in fade-in duration-300">
        <div className="text-center mb-10">
          <span className="inline-block px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold mb-3 border border-purple-200">
            Real In-Browser Compression
          </span>
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Compress PDF</h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Reduce PDF file size safely directly in your browser. No files are uploaded to any server.
          </p>
        </div>

        <div 
          onClick={() => fileInputRef.current?.click()}
          className="w-full max-w-3xl bg-white border-2 border-dashed border-purple-300 rounded-3xl p-16 text-center hover:bg-purple-50 hover:border-purple-500 transition-all duration-300 cursor-pointer group shadow-sm hover:shadow-md"
        >
          <input 
            type="file" 
            accept=".pdf,application/pdf" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleLocalUpload} 
          />
          <span className="text-6xl mb-6 block group-hover:scale-110 transition-transform duration-300">🗜️</span>
          <h3 className="text-2xl font-bold text-slate-800 mb-2">Select PDF file</h3>
          <p className="text-slate-500">or drop PDF here</p>
        </div>
      </div>
    );
  }

  // 2. Completed state
  if (isCompleted) {
    const savings = originalSize > newSize 
      ? Math.round(((originalSize - newSize) / originalSize) * 100)
      : 0;

    return (
      <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in zoom-in duration-300 bg-white rounded-3xl border border-slate-200 shadow-sm max-w-3xl mx-auto p-8">
        <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6 text-4xl">
          ✓
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">PDF Compressed Successfully!</h1>
        <p className="text-slate-500 mb-8 max-w-md mx-auto">
          Your document was compressed locally with verified data integrity.
        </p>

        <div className="flex items-center justify-center gap-8 p-6 bg-slate-50 rounded-2xl mb-8 w-full max-w-md border border-slate-100">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Original</p>
            <p className="text-lg font-bold text-slate-700">{formatSize(originalSize)}</p>
          </div>
          <span className="text-2xl text-slate-300">→</span>
          <div>
            <p className="text-xs text-purple-600 font-semibold uppercase">Compressed</p>
            <p className="text-lg font-bold text-purple-700">{formatSize(newSize)}</p>
          </div>
          {savings > 0 && (
            <div className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-bold">
              -{savings}%
            </div>
          )}
        </div>

        <button 
          onClick={handleDownload}
          className="btn btn-primary py-4 px-10 rounded-xl text-lg flex items-center gap-3 shadow-lg shadow-purple-200"
        >
          <span>⬇️</span>
          Download Compressed PDF
        </button>
        <SaveToDriveButton className="mt-3 max-w-sm" blob={compressedFileBlob} filename="compressed_document.pdf" />

        <button 
          onClick={() => {
            clearFiles();
            setIsCompleted(false);
            setCompressedFileBlob(null);
          }}
          className="mt-6 text-slate-500 hover:text-slate-800 font-medium transition-colors text-sm"
        >
          Compress another file
        </button>
      </div>
    );
  }

  // 3. Workspace state
  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Compress PDF</h1>
        <p className="text-slate-500 mt-1">Optimize structural streams and compaction for your document.</p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          {errorMsg}
        </div>
      )}

      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between p-4 bg-purple-50/50 rounded-xl border border-purple-100">
          <div className="flex items-center gap-4">
            <span className="text-3xl">📄</span>
            <div>
              <p className="font-semibold text-slate-800">{activeFiles[0]?.name}</p>
              <p className="text-xs text-slate-500">{formatSize(activeFiles[0]?.size)}</p>
            </div>
          </div>
          <button 
            onClick={() => clearFiles()} 
            className="text-xs text-red-500 hover:text-red-700 font-semibold"
          >
            Change file
          </button>
        </div>

        <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 text-sm text-slate-600">
          <p className="font-semibold text-slate-800 mb-1">⚡ Fast & Private</p>
          <p>This tool compresses your document within your browser engine using zero external network calls.</p>
        </div>

        <button 
          onClick={handleCompress}
          disabled={isProcessing}
          className="w-full btn btn-primary py-4 px-6 rounded-xl flex justify-center items-center gap-3 text-lg disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Compressing PDF...
            </>
          ) : 'Compress PDF'}
        </button>
      </div>
    </div>
  );
}
