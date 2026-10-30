import { useState } from 'react';
import { encodeBase64, decodeBase64 } from '../../../services/utilityEngine';

export default function Base64Converter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleEncode = () => {
    setErrorMsg(null);
    try {
      setOutput(encodeBase64(input));
    } catch {
      setErrorMsg('Failed to encode input text.');
    }
  };

  const handleDecode = () => {
    setErrorMsg(null);
    try {
      setOutput(decodeBase64(input));
    } catch {
      setErrorMsg('Invalid Base64 string. Please check input.');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Base64 Encoder & Decoder</h1>
        <p className="text-slate-500 mt-1">Encode text to Base64 or decode Base64 strings safely in the browser.</p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
          {errorMsg}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-sm">Input</h3>
          <textarea
            rows={10}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter text or base64 string here..."
            className="w-full p-3 font-mono text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/10"
          />
          <div className="flex gap-3">
            <button
              onClick={handleEncode}
              className="flex-1 btn btn-primary py-2.5 rounded-xl text-sm"
            >
              Encode to Base64
            </button>
            <button
              onClick={handleDecode}
              className="flex-1 btn btn-outline py-2.5 rounded-xl text-sm border-purple-300"
            >
              Decode
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-slate-800 text-sm">Output</h3>
              {output && (
                <button
                  onClick={handleCopy}
                  className="text-xs text-purple-600 hover:text-purple-800 font-bold"
                >
                  {copied ? 'Copied! ✓' : 'Copy'}
                </button>
              )}
            </div>
            <textarea
              rows={10}
              readOnly
              value={output}
              placeholder="Output will appear here..."
              className="w-full p-3 font-mono text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
            />
          </div>

          <div className="text-xs text-slate-400">
            Supports UTF-8 encoded characters.
          </div>
        </div>
      </div>
    </div>
  );
}
