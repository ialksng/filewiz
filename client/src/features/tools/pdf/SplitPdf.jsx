import { useEffect, useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import { useFile } from '../../../context/FileContext';
import { extractPdfPages } from '../../../services/pdfEngine';
import { downloadFile } from '../../../utils/downloadFile';
import PdfPageWorkspace from './PdfPageWorkspace';
import SaveToDriveButton from '../../../components/SaveToDriveButton';

export default function SplitPdf() {
  const { activeFiles, setActiveFiles, clearFiles } = useFile();
  const fileInputRef = useRef(null);

  const [pageRange, setPageRange] = useState('1');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [splitBlob, setSplitBlob] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [pageOrder, setPageOrder] = useState([]);
  const [selectedPages, setSelectedPages] = useState([1]);

  useEffect(() => {
    let cancelled = false;
    const loadPageCount = async () => {
      const file = activeFiles?.[0];
      if (!file) { setPageCount(0); setPageOrder([]); setSelectedPages([]); return; }
      try {
        const pdf = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
        if (cancelled) return;
        const count = pdf.getPageCount();
        setPageCount(count);
        setPageOrder(Array.from({ length: count }, (_, index) => index + 1));
        setSelectedPages(count ? [1] : []);
        setPageRange('1');
      } catch (cause) {
        if (!cancelled) setErrorMsg(cause?.message || 'Could not read this PDF.');
      }
    };
    loadPageCount();
    return () => { cancelled = true; };
  }, [activeFiles]);

  const handleUpload = (e) => {
    setErrorMsg(null);
    const files = Array.from(e.target.files).filter(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
    if (files.length > 0) {
      setActiveFiles(files);
    }
  };

  const parsePages = (str, total = pageCount) => {
    const pages = new Set();
    const parts = str.split(',').map(s => s.trim()).filter(Boolean);
    for (const part of parts) {
      const match = part.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
      if (!match) throw new Error('Use page numbers and ranges such as 1, 3-5.');
      const start = Number(match[1]);
      const end = Number(match[2] || match[1]);
      if (start < 1 || end > total || start > end) throw new Error(`Enter pages between 1 and ${total}.`);
      for (let page = start; page <= end; page += 1) pages.add(page);
    }
    return [...pages];
  };

  const handleSplit = async () => {
    if (!activeFiles || activeFiles.length === 0) return;
    
    let pages;
    try {
      const selection = new Set(parsePages(pageRange));
      pages = pageOrder.filter(page => selection.has(page));
    } catch (cause) {
      setErrorMsg(cause.message);
      return;
    }
    if (pages.length === 0) {
      setErrorMsg('Select at least one page to extract.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const splitBytes = await extractPdfPages(activeFiles[0], pages);
      const blob = new Blob([splitBytes], { type: 'application/pdf' });
      setSplitBlob(blob);
      setIsCompleted(true);
    } catch (err) {
      console.error('Split error:', err);
      setErrorMsg(err.message || 'Failed to split PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!splitBlob) return;
    const originalName = activeFiles[0]?.name.replace(/\.pdf$/i, '') || 'document';
    await downloadFile(splitBlob, `${originalName}_extracted.pdf`);
  };

  if (!activeFiles || activeFiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 animate-in fade-in duration-300 max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Split PDF</h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Extract selected pages or split specific page ranges into a separate PDF.
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
          <span className="text-6xl mb-6 block group-hover:scale-110 transition-transform duration-300">✂️</span>
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
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">PDF Pages Extracted!</h1>
        <p className="text-slate-500 mb-8 max-w-md mx-auto">
          Your selected pages ({pageRange}) have been saved into a clean document.
        </p>

        <button 
          onClick={handleDownload}
          className="btn btn-primary py-4 px-10 rounded-xl text-lg flex items-center gap-3 shadow-lg shadow-purple-200"
        >
          <span>⬇️</span>
          Download Extracted PDF
        </button>
        <SaveToDriveButton className="mt-3 max-w-sm" blob={splitBlob} filename={`${activeFiles[0]?.name.replace(/\.pdf$/i, '') || 'document'}_extracted.pdf`} />

        <button 
          onClick={() => {
            clearFiles();
            setIsCompleted(false);
            setSplitBlob(null);
          }}
          className="mt-6 text-slate-500 hover:text-slate-800 font-medium transition-colors text-sm"
        >
          Split another PDF
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Split PDF</h1>
        <p className="text-slate-500 mt-1">Specify which pages to extract from your document.</p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          {errorMsg}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(18rem,0.85fr)]">
        <PdfPageWorkspace file={activeFiles[0]} pages={pageOrder} onPagesChange={order => { setPageOrder(order); if (selectedPages.length) setPageRange(order.filter(page => selectedPages.includes(page)).join(', ')); }} selectedPages={selectedPages} onSelectedPagesChange={pages => { setSelectedPages(pages); setPageRange(pageOrder.filter(page => pages.includes(page)).join(', ')); }} selectionLabel="Select" />
        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
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
          <label className="block text-sm font-bold text-slate-800 mb-2">
            Page numbers or range to extract
          </label>
          <input 
            type="text"
            value={pageRange}
            onChange={(e) => {
              const value = e.target.value;
              setPageRange(value);
              try { setSelectedPages(parsePages(value)); } catch { /* Keep the current visual selection while the range is incomplete. */ }
            }}
            placeholder="e.g. 1-3, 5, 8"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/10 text-sm"
          />
          <p className="text-xs text-slate-400 mt-2">
            Select thumbnails or use commas and ranges. Drag the page grips to set the order in the extracted PDF. This file has {pageCount} pages.
          </p>
        </div>

        <button 
          onClick={handleSplit}
          disabled={isProcessing}
          className="w-full btn btn-primary py-4 px-6 rounded-xl flex justify-center items-center gap-3 text-lg disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Extracting Pages...
            </>
          ) : 'Extract Pages'}
        </button>
        </section>
      </div>
    </div>
  );
}
