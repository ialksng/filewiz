import { useState, useRef } from 'react';
import { useFile } from '../../../context/FileContext';
import { rotatePdf } from '../../../services/pdfEngine';
import { downloadFile } from '../../../utils/downloadFile';
import SaveToDriveButton from '../../../components/SaveToDriveButton';

export default function RotatePdf() {
  const { activeFiles, setActiveFiles, clearFiles } = useFile();
  const fileInputRef = useRef(null);

  const [angle, setAngle] = useState(90);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [rotatedBlob, setRotatedBlob] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleUpload = (e) => {
    setErrorMsg(null);
    const files = Array.from(e.target.files).filter(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
    if (files.length > 0) {
      setActiveFiles(files);
    }
  };

  const handleRotate = async () => {
    if (!activeFiles || activeFiles.length === 0) return;

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const bytes = await rotatePdf(activeFiles[0], angle);
      const blob = new Blob([bytes], { type: 'application/pdf' });
      setRotatedBlob(blob);
      setIsCompleted(true);
    } catch (err) {
      console.error('Rotate error:', err);
      setErrorMsg(err.message || 'Failed to rotate PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!rotatedBlob) return;
    const originalName = activeFiles[0]?.name.replace(/\.pdf$/i, '') || 'document';
    await downloadFile(rotatedBlob, `${originalName}_rotated.pdf`);
  };

  if (!activeFiles || activeFiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 animate-in fade-in duration-300 max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Rotate PDF</h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Permanently rotate PDF pages clockwise 90°, 180°, or 270°.
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
          <span className="text-6xl mb-6 block group-hover:scale-110 transition-transform duration-300">🔄</span>
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
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">PDF Rotated Successfully!</h1>
        <p className="text-slate-500 mb-8 max-w-md mx-auto">
          Pages were rotated {angle}° clockwise and saved.
        </p>

        <button 
          onClick={handleDownload}
          className="btn btn-primary py-4 px-10 rounded-xl text-lg flex items-center gap-3 shadow-lg shadow-purple-200"
        >
          <span>⬇️</span>
          Download Rotated PDF
        </button>
        <SaveToDriveButton className="mt-3 max-w-sm" blob={rotatedBlob} filename={`${activeFiles[0]?.name.replace(/\.pdf$/i, '') || 'document'}_rotated.pdf`} />

        <button 
          onClick={() => {
            clearFiles();
            setIsCompleted(false);
            setRotatedBlob(null);
          }}
          className="mt-6 text-slate-500 hover:text-slate-800 font-medium transition-colors text-sm"
        >
          Rotate another PDF
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Rotate PDF</h1>
        <p className="text-slate-500 mt-1">Select the rotation angle for your document pages.</p>
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
          <button 
            onClick={() => clearFiles()} 
            className="text-xs text-red-500 hover:text-red-700 font-semibold"
          >
            Change file
          </button>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-800 mb-3">
            Rotation Angle
          </label>
          <div className="grid grid-cols-3 gap-4">
            {[90, 180, 270].map((deg) => (
              <button
                key={deg}
                type="button"
                onClick={() => setAngle(deg)}
                className={`p-4 rounded-xl border-2 font-bold text-center transition-all ${
                  angle === deg
                    ? 'border-purple-600 bg-purple-50 text-purple-700 shadow-sm'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span className="block text-2xl mb-1">↻</span>
                {deg}° Clockwise
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={handleRotate}
          disabled={isProcessing}
          className="w-full btn btn-primary py-4 px-6 rounded-xl flex justify-center items-center gap-3 text-lg disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Rotating PDF...
            </>
          ) : `Rotate PDF (${angle}°)`}
        </button>
      </div>
    </div>
  );
}
