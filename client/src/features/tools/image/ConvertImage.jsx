import { useState, useRef, useEffect } from 'react';
import { convertImageFormat, supportsCanvasImageFormat } from '../../../services/imageEngine';
import { downloadFile } from '../../../utils/downloadFile';
import ImagePreviewWorkspace from './ImagePreviewWorkspace';
import { useFile } from '../../../context/FileContext';
import SaveToDriveButton from '../../../components/SaveToDriveButton';

export default function ConvertImage() {
  const { activeFiles } = useFile();
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(() => activeFiles.find(file => file.type.startsWith('image/') || /\.(avif|bmp|gif|jpe?g|png|svg|tiff?)$/i.test(file.name)) || null);
  const [targetFormat, setTargetFormat] = useState('image/png');
  const [quality, setQuality] = useState(0.9);
  const [avifSupported, setAvifSupported] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [convertedBlob, setConvertedBlob] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    let active = true;
    supportsCanvasImageFormat('image/avif').then(supported => { if (active) setAvifSupported(supported); });
    return () => { active = false; };
  }, []);

  const outputFormats = [
    { id: 'image/png', label: 'PNG', desc: 'Lossless · transparency' },
    { id: 'image/svg+xml', label: 'SVG', desc: 'SVG wrapper · embeds the image' },
    { id: 'image/jpeg', label: 'JPG', desc: 'Widely supported · compact' },
    { id: 'image/webp', label: 'WebP', desc: 'Modern · smaller files' },
    ...(avifSupported ? [{ id: 'image/avif', label: 'AVIF', desc: 'High compression · newer apps' }] : []),
    { id: 'image/bmp', label: 'BMP', desc: 'Uncompressed · broad support' },
  ];

  const handleUpload = (e) => {
    setErrorMsg(null);
    const file = e.target.files[0];
    if (file && (file.type.startsWith('image/') || /\.(avif|bmp|gif|jpe?g|png|svg|tiff?)$/i.test(file.name))) {
      setSelectedFile(file);
      setConvertedBlob(null);
      setIsCompleted(false);
    } else if (file) {
      setErrorMsg('Choose a supported image file such as PNG, JPG, WebP, GIF, BMP, AVIF, SVG, or TIFF. Some formats depend on browser support.');
    }
  };

  const handleConvert = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const blob = await convertImageFormat(selectedFile, targetFormat, Number(quality));
      setConvertedBlob(blob);
      setIsCompleted(true);
    } catch (err) {
      console.error('Image convert error:', err);
      setErrorMsg(err.message || 'Failed to convert image.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getExtension = (mime) => {
    return ({ 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/avif': 'avif', 'image/bmp': 'bmp', 'image/png': 'png', 'image/svg+xml': 'svg' })[mime] || 'png';
  };

  const handleDownload = async () => {
    if (!convertedBlob) return;
    const baseName = selectedFile.name.substring(0, selectedFile.name.lastIndexOf('.')) || 'image';
    await downloadFile(convertedBlob, `${baseName}.${getExtension(targetFormat)}`);
  };

  if (!selectedFile) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 animate-in fade-in duration-300 max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Convert Image Format</h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Convert between PNG, JPG, WebP, BMP, and AVIF when supported by your browser. GIF, BMP, AVIF, SVG, and TIFF inputs work when your browser can open them.
          </p>
        </div>

        <div 
          onClick={() => fileInputRef.current?.click()}
          className="w-full bg-white border-2 border-dashed border-purple-300 rounded-3xl p-16 text-center hover:bg-purple-50 hover:border-purple-500 transition-all duration-300 cursor-pointer group shadow-sm hover:shadow-md"
        >
          <input 
            type="file" 
            accept="image/*,.avif,.bmp,.gif,.jpeg,.jpg,.png,.svg,.tif,.tiff,.webp"
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleUpload} 
          />
          <span className="text-6xl mb-6 block group-hover:scale-110 transition-transform duration-300">🔄</span>
          <h3 className="text-2xl font-bold text-slate-800 mb-2">Select Image to Convert</h3>
          <p className="text-slate-500">PNG, JPG, WebP, GIF, BMP, AVIF, SVG, and TIFF inputs (browser support varies)</p>
        </div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in zoom-in duration-300 bg-white rounded-3xl border border-slate-200 shadow-sm max-w-3xl mx-auto p-8">
        <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6 text-4xl">
          ✓
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Image Converted!</h1>
        <p className="text-slate-500 mb-8 max-w-md mx-auto">
          Successfully converted to <span className="font-bold uppercase text-purple-700">{getExtension(targetFormat)}</span>.
        </p>
        <div className="mb-6 w-full"><ImagePreviewWorkspace source={selectedFile} output={convertedBlob} outputLabel="Converted image" /></div>

        <button 
          onClick={handleDownload}
          className="btn btn-primary py-4 px-10 rounded-xl text-lg flex items-center gap-3 shadow-lg shadow-purple-200"
        >
          <span>⬇️</span>
          Download Converted Image
        </button>
        <SaveToDriveButton className="mt-3" blob={convertedBlob} filename={`${selectedFile.name.substring(0, selectedFile.name.lastIndexOf('.')) || 'image'}.${getExtension(targetFormat)}`} />

        <button 
          onClick={() => {
            setSelectedFile(null);
            setConvertedBlob(null);
            setIsCompleted(false);
          }}
          className="mt-6 text-slate-500 hover:text-slate-800 font-medium transition-colors text-sm"
        >
          Convert another image
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Convert Image Format</h1>
        <p className="text-slate-500 mt-1">See your image preview, choose an output format, then preview and download the converted copy. Your original stays unchanged.</p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          {errorMsg}
        </div>
      )}

      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <ImagePreviewWorkspace source={selectedFile} output={convertedBlob} outputLabel="Converted image" />
        <div className="flex items-center justify-between p-4 bg-purple-50/50 rounded-xl border border-purple-100">
          <div className="flex items-center gap-4">
            <span className="text-3xl">🖼️</span>
            <div>
              <p className="font-semibold text-slate-800">{selectedFile.name}</p>
              <p className="text-xs text-slate-500">{selectedFile.type || 'image'}</p>
            </div>
          </div>
          <button onClick={() => setSelectedFile(null)} className="text-xs text-red-500 hover:text-red-700 font-semibold">
            Change
          </button>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-800 mb-3">Target Format</label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {outputFormats.map((fmt) => (
              <button
                key={fmt.id}
                type="button"
                onClick={() => setTargetFormat(fmt.id)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  targetFormat === fmt.id
                    ? 'border-purple-600 bg-purple-50 text-purple-700 font-bold shadow-sm'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span className="block text-lg font-bold">{fmt.label}</span>
                <span className="block text-xs font-normal text-slate-500 mt-1">{fmt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {targetFormat !== 'image/png' && targetFormat !== 'image/bmp' && (
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">
              Quality: {Math.round(quality * 100)}%
            </label>
            <input 
              type="range"
              min="0.4"
              max="1.0"
              step="0.05"
              value={quality}
              onChange={(e) => setQuality(e.target.value)}
              className="w-full accent-purple-600"
            />
          </div>
        )}

        <button 
          onClick={handleConvert}
          disabled={isProcessing}
          className="w-full btn btn-primary py-4 px-6 rounded-xl flex justify-center items-center gap-3 text-lg disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Converting Image...
            </>
          ) : `Convert to ${getExtension(targetFormat).toUpperCase()}`}
        </button>
      </div>
    </div>
  );
}
