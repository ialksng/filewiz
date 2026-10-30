import { useState, useRef } from 'react';
import { useFile } from '../../../context/FileContext';
import { imagesToPdf } from '../../../services/pdfEngine';
import { downloadFile } from '../../../utils/downloadFile';
import SaveToDriveButton from '../../../components/SaveToDriveButton';
import ImageCollectionWorkspace from '../image/ImageCollectionWorkspace';

export default function ImagesToPdf() {
  const { clearFiles } = useFile();
  const fileInputRef = useRef(null);

  const [images, setImages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [pdfBlob, setPdfBlob] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleUpload = (e) => {
    setErrorMsg(null);
    const added = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
    if (added.length > 0) {
      setImages(prev => [...prev, ...added]);
    }
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleConvert = async () => {
    if (images.length === 0) {
      setErrorMsg('Please select at least one image file.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const pdfBytes = await imagesToPdf(images);
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setPdfBlob(blob);
      setIsCompleted(true);
    } catch (err) {
      console.error('Image to PDF error:', err);
      setErrorMsg(err.message || 'Failed to convert images to PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!pdfBlob) return;
    await downloadFile(pdfBlob, 'converted_images.pdf');
  };

  if (isCompleted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in zoom-in duration-300 bg-white rounded-3xl border border-slate-200 shadow-sm max-w-3xl mx-auto p-8">
        <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6 text-4xl">
          ✓
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Images Converted to PDF!</h1>
        <p className="text-slate-500 mb-8 max-w-md mx-auto">
          {images.length} images were merged into a single multi-page PDF document.
        </p>

        <button 
          onClick={handleDownload}
          className="btn btn-primary py-4 px-10 rounded-xl text-lg flex items-center gap-3 shadow-lg shadow-purple-200"
        >
          <span>⬇️</span>
          Download PDF Document
        </button>
        <SaveToDriveButton className="mt-3 max-w-sm" blob={pdfBlob} filename="converted_images.pdf" />

        <button 
          onClick={() => {
            clearFiles();
            setImages([]);
            setIsCompleted(false);
            setPdfBlob(null);
          }}
          className="mt-6 text-slate-500 hover:text-slate-800 font-medium transition-colors text-sm"
        >
          Convert more images
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Images to PDF</h1>
        <p className="text-slate-500 mt-1">Convert JPG, PNG, and WebP images into a formatted PDF document.</p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          {errorMsg}
        </div>
      )}

      {images.length === 0 ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="bg-white border-2 border-dashed border-purple-300 rounded-3xl p-16 text-center hover:bg-purple-50 hover:border-purple-500 transition-all duration-300 cursor-pointer group shadow-sm hover:shadow-md"
        >
          <input 
            type="file" 
            accept="image/png,image/jpeg,image/webp,image/*" 
            multiple 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleUpload} 
          />
          <span className="text-6xl mb-6 block group-hover:scale-110 transition-transform duration-300">🖼️</span>
          <h3 className="text-2xl font-bold text-slate-800 mb-2">Select Images</h3>
          <p className="text-slate-500">Supports JPG, PNG, and WebP</p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(18rem,0.85fr)]">
          <div className="space-y-4">
            <input 
              type="file" 
              accept="image/*" 
              multiple 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleUpload} 
            />
            <div className="flex justify-end">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="min-h-11 rounded-lg px-3 text-sm font-semibold text-purple-700 hover:bg-purple-50"
            >
              + Add more
            </button>
            </div>
            <ImageCollectionWorkspace images={images} onImagesChange={setImages} onRemove={removeImage} label="Page" />
          </div>
          <aside className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-bold text-slate-900">Images to PDF</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">Your images will become pages in the displayed order. Drag the grips to arrange the document before creating it.</p>
          <button 
            onClick={handleConvert}
            disabled={isProcessing}
            className="btn btn-primary mt-6 w-full justify-center rounded-xl py-4 text-lg shadow-lg disabled:opacity-50 sm:mt-auto"
          >
            {isProcessing ? (
              <>
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating PDF Document...
              </>
            ) : `Convert ${images.length} Images to PDF`}
          </button>
          </aside>
        </div>
      )}
    </div>
  );
}
