import { useState, useRef } from 'react';
import { compressImage } from '../../../services/imageEngine';
import ImagePreviewWorkspace from './ImagePreviewWorkspace';
import { downloadFile } from '../../../utils/downloadFile';
import SaveToDriveButton from '../../../components/SaveToDriveButton';
import { useFile } from '../../../context/FileContext';

export default function CompressImage() {
  const { activeFiles } = useFile();
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(() => activeFiles.find(file => file.type.startsWith('image/')) || null);
  const [maxSizeMB, setMaxSizeMB] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [compressedFile, setCompressedFile] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleUpload = (e) => {
    setErrorMsg(null);
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setIsCompleted(false);
    }
  };

  const handleCompress = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const res = await compressImage(selectedFile, {
        maxSizeMB: Number(maxSizeMB),
        maxWidthOrHeight: 2048,
        useWebWorker: true,
      });
      setCompressedFile(res);
      setIsCompleted(true);
    } catch (err) {
      console.error('Image compress error:', err);
      setErrorMsg(err.message || 'Failed to compress image.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!compressedFile) return;
    await downloadFile(compressedFile, `compressed_${selectedFile.name}`);
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  if (!selectedFile) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 animate-in fade-in duration-300 max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Compress Image</h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Reduce JPG, PNG, and WebP image sizes instantly without quality loss.
          </p>
        </div>

        <div 
          onClick={() => fileInputRef.current?.click()}
          className="w-full bg-white border-2 border-dashed border-purple-300 rounded-3xl p-16 text-center hover:bg-purple-50 hover:border-purple-500 transition-all duration-300 cursor-pointer group shadow-sm hover:shadow-md"
        >
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleUpload} 
          />
          <span className="text-6xl mb-6 block group-hover:scale-110 transition-transform duration-300">🗜️</span>
          <h3 className="text-2xl font-bold text-slate-800 mb-2">Select Image</h3>
          <p className="text-slate-500">Supports JPG, PNG, WebP</p>
        </div>
      </div>
    );
  }

  if (isCompleted && compressedFile) {
    const savings = selectedFile.size > compressedFile.size
      ? Math.round(((selectedFile.size - compressedFile.size) / selectedFile.size) * 100)
      : 0;

    return (
      <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in zoom-in duration-300 bg-white rounded-3xl border border-slate-200 shadow-sm max-w-3xl mx-auto p-8">
        <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6 text-4xl">
          ✓
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Image Compressed!</h1>
        <p className="text-slate-500 mb-8 max-w-md mx-auto">
          Optimized using client-side compression.
        </p>

        <div className="mb-6 w-full max-w-3xl"><ImagePreviewWorkspace source={selectedFile} output={compressedFile} outputLabel="Compressed image" /></div>

        <div className="flex items-center justify-center gap-8 p-6 bg-slate-50 rounded-2xl mb-8 w-full max-w-md border border-slate-100">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Original</p>
            <p className="text-lg font-bold text-slate-700">{formatSize(selectedFile.size)}</p>
          </div>
          <span className="text-2xl text-slate-300">→</span>
          <div>
            <p className="text-xs text-purple-600 font-semibold uppercase">Compressed</p>
            <p className="text-lg font-bold text-purple-700">{formatSize(compressedFile.size)}</p>
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
          Download Compressed Image
        </button>
        <SaveToDriveButton className="mt-3 max-w-sm" blob={compressedFile} filename={`compressed_${selectedFile.name}`} />

        <button 
          onClick={() => {
            setSelectedFile(null);
            setCompressedFile(null);
            setIsCompleted(false);
          }}
          className="mt-6 text-slate-500 hover:text-slate-800 font-medium transition-colors text-sm"
        >
          Compress another image
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Compress Image</h1>
        <p className="text-slate-500 mt-1">Set maximum target size and optimize your image.</p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          {errorMsg}
        </div>
      )}

      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between p-4 bg-purple-50/50 rounded-xl border border-purple-100">
          <div className="flex items-center gap-4">
            <span className="text-3xl">🖼️</span>
            <div>
              <p className="font-semibold text-slate-800">{selectedFile.name}</p>
              <p className="text-xs text-slate-500">{formatSize(selectedFile.size)}</p>
            </div>
          </div>
          <button onClick={() => setSelectedFile(null)} className="text-xs text-red-500 hover:text-red-700 font-semibold">
            Change
          </button>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-800 mb-2">
            Target Maximum Size: {maxSizeMB} MB
          </label>
          <input 
            type="range"
            min="0.2"
            max="5"
            step="0.2"
            value={maxSizeMB}
            onChange={(e) => setMaxSizeMB(e.target.value)}
            className="w-full accent-purple-600"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>200 KB (High compression)</span>
            <span>5 MB (Maximum detail)</span>
          </div>
        </div>

        <button 
          onClick={handleCompress}
          disabled={isProcessing}
          className="w-full btn btn-primary py-4 px-6 rounded-xl flex justify-center items-center gap-3 text-lg disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Compressing Image...
            </>
          ) : 'Compress Image Now'}
        </button>
      </div>
    </div>
  );
}
