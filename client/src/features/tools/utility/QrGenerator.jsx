import { downloadFile } from '../../../utils/downloadFile';
import QRCode from 'qrcode';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function QrGenerator() {
  const [searchParams] = useSearchParams();
  const [text, setText] = useState(() => searchParams.get('text') || `https://ialksng.me${import.meta.env.BASE_URL}`);
  const [size, setSize] = useState(256);
  const canvasRef = useRef(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    QRCode.toCanvas(canvas, text || ' ', {
      width: Number(size),
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#111827', light: '#FFFFFF' },
    }, cause => {
      if (cancelled) return;
      setError(cause ? 'This content is too long to fit in a QR code.' : '');
    });
    return () => { cancelled = true; };
  }, [text, size]);

  const handleDownload = async () => {
    const canvas = canvasRef.current;
    if (!canvas || error) return;
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    if (blob) await downloadFile(blob, 'qrcode.png');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">QR Code Generator</h1>
        <p className="text-slate-500 mt-1">Generate high-resolution scannable QR codes for links, text, and contact cards.</p>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm grid md:grid-cols-2 gap-8 items-center">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">Target URL or Content</label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="https://yourwebsite.com or any text"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/10 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">QR Dimension: {size}×{size}px</label>
            <input
              type="range"
              min="150"
              max="500"
              step="50"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="w-full accent-purple-600"
            />
          </div>

          <button
            onClick={handleDownload}
            className="w-full btn btn-primary py-3.5 rounded-xl font-bold flex items-center justify-center gap-2"
          >
            <span>⬇️</span> Download PNG QR Code
          </button>
        </div>

        <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-200">
            <canvas ref={canvasRef} role="img" aria-label="QR code preview" className="h-48 w-48 object-contain" />
          </div>
          <p className="text-xs text-slate-400 mt-3 font-medium">Generated privately in your browser.</p>
        </div>
      </div>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    </div>
  );
}
