import { useState, useRef, useEffect } from 'react';
import { generateFavicons } from '../../../services/imageEngine';
import { downloadFile } from '../../../utils/downloadFile';
import { useFile } from '../../../context/FileContext';

export default function FaviconGenerator() {
  const { activeFiles } = useFile();
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(() => activeFiles.find(file => file.type.startsWith('image/')) || null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [favicons, setFavicons] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => () => favicons.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl)), [favicons]);

  const handleUpload = (e) => {
    setErrorMsg(null);
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setFavicons([]);
    }
  };

  const handleGenerate = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const results = await generateFavicons(selectedFile);
      setFavicons(results.map(item => ({ ...item, previewUrl: URL.createObjectURL(item.blob) })));
    } catch (err) {
      console.error('Favicon generation error:', err);
      setErrorMsg(err.message || 'Failed to generate favicons.');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadFavicon = async (blob, size) => {
    await downloadFile(blob, `favicon-${size}x${size}.png`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Favicon Generator</h1>
        <p className="text-slate-500 mt-1">Generate multi-resolution icons (16x16, 32x32, 48x48, 180x180) for your website.</p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          {errorMsg}
        </div>
      )}

      {!selectedFile ? (
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
          <span className="text-6xl mb-6 block group-hover:scale-110 transition-transform duration-300">⭐</span>
          <h3 className="text-2xl font-bold text-slate-800 mb-2">Select Logo or Image</h3>
          <p className="text-slate-500">Square PNG or SVG with transparent background recommended</p>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between p-4 bg-purple-50/50 rounded-xl border border-purple-100">
            <div className="flex items-center gap-4">
              <span className="text-3xl">🖼️</span>
              <div>
                <p className="font-semibold text-slate-800">{selectedFile.name}</p>
                <p className="text-xs text-slate-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <button onClick={() => { setSelectedFile(null); setFavicons([]); }} className="text-xs text-red-500 hover:text-red-700 font-semibold">
              Change
            </button>
          </div>

          {favicons.length === 0 ? (
            <button 
              onClick={handleGenerate}
              disabled={isProcessing}
              className="w-full btn btn-primary py-4 px-6 rounded-xl flex justify-center items-center gap-3 text-lg disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Generating Favicons...
                </>
              ) : 'Generate Favicon Suite'}
            </button>
          ) : (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 text-sm">Generated Favicon Sizes:</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {favicons.map(({ size, blob }) => (
                  <div key={size} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center flex flex-col items-center">
                    <div className="w-16 h-16 flex items-center justify-center bg-white rounded-lg border border-slate-200 mb-3 shadow-inner">
                      <img 
                        src={favicons.find(item => item.size === size)?.previewUrl}
                        alt={`${size}x${size}`}
                        style={{ width: `${Math.min(size, 48)}px`, height: `${Math.min(size, 48)}px` }}
                        className="object-contain"
                      />
                    </div>
                    <p className="font-bold text-sm text-slate-800 mb-2">{size} × {size}</p>
                    <button 
                      onClick={() => downloadFavicon(blob, size)}
                      className="text-xs bg-purple-600 text-white font-semibold py-1.5 px-3 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
