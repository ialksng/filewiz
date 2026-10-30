import { useState, useRef, useEffect } from 'react';
import { performOcr } from '../../../services/ocrEngine';
import { downloadFile } from '../../../utils/downloadFile';
import { useFile } from '../../../context/FileContext';

export default function OcrExtractor() {
  const { activeFiles } = useFile();
  const initialFile = activeFiles.find(file => file.type.startsWith('image/') || /\.(png|jpe?g|webp|bmp|gif)$/i.test(file.name)) || null;
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(initialFile);
  const [previewUrl, setPreviewUrl] = useState(() => initialFile ? URL.createObjectURL(initialFile) : null);
  const [language, setLanguage] = useState('eng');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressInfo, setProgressInfo] = useState({ status: '', progress: 0 });
  const [extractedText, setExtractedText] = useState('');
  const [confidence, setConfidence] = useState(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const handleUpload = (e) => {
    setErrorMsg(null);
    const file = e.target.files[0];
    if (file && (file.type.startsWith('image/') || file.name.match(/\.(png|jpe?g|webp|bmp|gif)$/i))) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setExtractedText('');
      setConfidence(null);
    } else {
      setErrorMsg('Please select an image file (PNG, JPG, WebP) to extract text.');
    }
  };

  const handleRunOcr = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setErrorMsg(null);
    setProgressInfo({ status: 'Initializing OCR Engine...', progress: 5 });

    try {
      const res = await performOcr(selectedFile, language, (p) => {
        setProgressInfo(p);
      });

      setExtractedText(res.text || 'No selectable text could be found in this image.');
      setConfidence(res.confidence);
    } catch (err) {
      console.error('OCR Extraction error:', err);
      setErrorMsg(err.message || 'Failed to extract text from the selected image.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = async () => {
    const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8' });
    await downloadFile(blob, `${selectedFile?.name.replace(/\.[^/.]+$/, '')}_ocr_extracted.txt`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-4xl mx-auto">
      <div>
        <span className="inline-block px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold mb-3 border border-purple-200">
          Neural OCR · In-Browser Privacy
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900">OCR Text Extractor</h1>
        <p className="text-slate-500 mt-1">Extract editable text from scanned documents, screenshots, and photos with zero server uploads.</p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
          {errorMsg}
        </div>
      )}

      {!selectedFile ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="bg-white border-2 border-dashed border-purple-300 rounded-3xl p-16 text-center hover:bg-purple-50 hover:border-purple-500 transition-all duration-300 cursor-pointer group shadow-sm hover:shadow-md"
        >
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleUpload} 
          />
          <span className="text-6xl mb-6 block group-hover:scale-110 transition-transform duration-300">👁️</span>
          <h3 className="text-2xl font-bold text-slate-800 mb-2">Select Image or Scanned Document</h3>
          <p className="text-slate-500">Supports JPG, PNG, WebP screenshots & scans</p>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between p-4 bg-purple-50/50 rounded-xl border border-purple-100">
            <div className="flex items-center gap-4">
              {previewUrl && (
                <img 
                  src={previewUrl} 
                  alt="Thumbnail" 
                  className="w-14 h-14 object-cover rounded-lg border border-purple-200"
                />
              )}
              <div>
                <p className="font-semibold text-slate-800 text-sm">{selectedFile.name}</p>
                <p className="text-xs text-slate-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <button 
              onClick={() => { setSelectedFile(null); setPreviewUrl(null); setExtractedText(''); }} 
              className="text-xs text-red-500 hover:text-red-700 font-semibold"
            >
              Change file
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Recognition Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-purple-600"
              >
                <option value="eng">English (eng)</option>
                <option value="spa">Spanish (spa)</option>
                <option value="fra">French (fra)</option>
                <option value="deu">German (deu)</option>
              </select>
            </div>

            {!extractedText && (
              <button
                onClick={handleRunOcr}
                disabled={isProcessing}
                className="btn btn-primary px-8 py-3 rounded-xl font-bold text-sm disabled:opacity-50"
              >
                {isProcessing ? 'Analyzing Document...' : 'Extract Text Now ✨'}
              </button>
            )}
          </div>

          {isProcessing && (
            <div className="space-y-2 p-5 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <div className="flex justify-between text-xs text-slate-600 font-semibold mb-1">
                <span className="capitalize">{progressInfo.status || 'Processing neural OCR...'}</span>
                <span>{progressInfo.progress}%</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-purple-600 h-full transition-all duration-300" 
                  style={{ width: `${Math.max(progressInfo.progress, 10)}%` }}
                ></div>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Running locally in WebAssembly via Tesseract.js.
              </p>
            </div>
          )}

          {extractedText && (
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-slate-800 text-sm">Extracted Text</h3>
                  {confidence !== null && (
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {Math.round(confidence)}% Confidence
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="px-4 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                  >
                    {copied ? 'Copied! ✓' : 'Copy Text'}
                  </button>
                  <button
                    onClick={handleDownloadTxt}
                    className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    Download .txt
                  </button>
                </div>
              </div>

              <textarea
                rows={10}
                value={extractedText}
                onChange={(e) => setExtractedText(e.target.value)}
                className="w-full p-4 font-mono text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-purple-600 leading-relaxed"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
