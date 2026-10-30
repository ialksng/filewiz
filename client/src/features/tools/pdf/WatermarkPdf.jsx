import { useState, useRef } from 'react';
import { useFile } from '../../../context/FileContext';
import { addWatermarkToPdf } from '../../../services/pdfEngine';
import { downloadFile } from '../../../utils/downloadFile';
import SaveToDriveButton from '../../../components/SaveToDriveButton';

export default function WatermarkPdf() {
  const { activeFiles, setActiveFiles, clearFiles } = useFile();
  const fileInputRef = useRef(null);

  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [opacity, setOpacity] = useState(0.3);
  const [fontSize, setFontSize] = useState(48);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [watermarkedBlob, setWatermarkedBlob] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleUpload = (e) => {
    setErrorMsg(null);
    const files = Array.from(e.target.files).filter(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
    if (files.length > 0) {
      setActiveFiles(files);
    }
  };

  const handleApplyWatermark = async () => {
    if (!activeFiles || activeFiles.length === 0) return;
    if (!watermarkText.trim()) {
      setErrorMsg('Please enter watermark text.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const bytes = await addWatermarkToPdf(activeFiles[0], watermarkText, {
        opacity: Number(opacity),
        fontSize: Number(fontSize)
      });
      const blob = new Blob([bytes], { type: 'application/pdf' });
      setWatermarkedBlob(blob);
      setIsCompleted(true);
    } catch (err) {
      console.error('Watermark error:', err);
      setErrorMsg(err.message || 'Failed to add watermark.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!watermarkedBlob) return;
    const originalName = activeFiles[0]?.name.replace(/\.pdf$/i, '') || 'document';
    await downloadFile(watermarkedBlob, `${originalName}_watermarked.pdf`);
  };

  if (!activeFiles || activeFiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 animate-in fade-in duration-300 max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Add Watermark to PDF</h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Stamp a custom security watermark text across all pages of your PDF document.
          </p>
        </div>

        <div 
          onClick={() => fileInputRef.current?.click()}
          className="w-full bg-white border-2 border-dashed border-purple-300 rounded-3xl p-16 text-center hover:bg-purple-50 hover:border-purple-500 transition-all duration-300 cursor-pointer group shadow-sm hover:shadow-md"
        >
          <input 
            type="file" 
            accept=".pdf,application/pdf" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleUpload} 
          />
          <span className="text-6xl mb-6 block group-hover:scale-110 transition-transform duration-300">©️</span>
          <h3 className="text-2xl font-bold text-slate-800 mb-2">Select PDF file</h3>
          <p className="text-slate-500">or drop PDF here</p>
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
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Watermark Added!</h1>
        <p className="text-slate-500 mb-8 max-w-md mx-auto">
          "{watermarkText}" has been stamped across all document pages.
        </p>

        <button 
          onClick={handleDownload}
          className="btn btn-primary py-4 px-10 rounded-xl text-lg flex items-center gap-3 shadow-lg shadow-purple-200"
        >
          <span>⬇️</span>
          Download Watermarked PDF
        </button>
        <SaveToDriveButton className="mt-3 max-w-sm" blob={watermarkedBlob} filename={`${activeFiles[0]?.name.replace(/\.pdf$/i, '') || 'document'}_watermarked.pdf`} />

        <button 
          onClick={() => {
            clearFiles();
            setIsCompleted(false);
            setWatermarkedBlob(null);
          }}
          className="mt-6 text-slate-500 hover:text-slate-800 font-medium transition-colors text-sm"
        >
          Watermark another file
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Add Watermark</h1>
        <p className="text-slate-500 mt-1">Configure watermark text and formatting for your PDF.</p>
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
              <p className="text-xs text-slate-500">{(activeFiles[0]?.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
          <button onClick={() => clearFiles()} className="text-xs text-red-500 hover:text-red-700 font-semibold">
            Change file
          </button>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-800 mb-2">Watermark Text</label>
          <input 
            type="text" 
            value={watermarkText} 
            onChange={(e) => setWatermarkText(e.target.value)}
            placeholder="e.g. DRAFT, CONFIDENTIAL"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/10 text-sm font-medium"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Opacity: {Math.round(opacity * 100)}%</label>
            <input 
              type="range" 
              min="0.1" 
              max="0.9" 
              step="0.05" 
              value={opacity} 
              onChange={(e) => setOpacity(e.target.value)}
              className="w-full accent-purple-600"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Font Size: {fontSize}px</label>
            <input 
              type="range" 
              min="24" 
              max="96" 
              step="4" 
              value={fontSize} 
              onChange={(e) => setFontSize(e.target.value)}
              className="w-full accent-purple-600"
            />
          </div>
        </div>

        <button 
          onClick={handleApplyWatermark}
          disabled={isProcessing || !watermarkText.trim()}
          className="w-full btn btn-primary py-4 px-6 rounded-xl flex justify-center items-center gap-3 text-lg disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Stamping Watermark...
            </>
          ) : 'Apply Watermark'}
        </button>
      </div>
    </div>
  );
}
