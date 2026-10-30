import { useState } from 'react';
import { generatePassword, generateUuid } from '../../../services/utilityEngine';

export default function PasswordGenerator() {
  const [length, setLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  
  const [password, setPassword] = useState(() => generatePassword({ length: 16 }));
  const [uuid, setUuid] = useState(() => generateUuid());
  const [copiedPass, setCopiedPass] = useState(false);
  const [copiedUuid, setCopiedUuid] = useState(false);

  const handleGeneratePassword = () => {
    setPassword(generatePassword({
      length: Number(length),
      uppercase: includeUppercase,
      lowercase: true,
      numbers: includeNumbers,
      symbols: includeSymbols
    }));
  };

  const handleCopyPass = () => {
    navigator.clipboard.writeText(password);
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 2000);
  };

  const handleCopyUuid = () => {
    navigator.clipboard.writeText(uuid);
    setCopiedUuid(true);
    setTimeout(() => setCopiedUuid(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Secure Password & UUID Generator</h1>
        <p className="text-slate-500 mt-1">Generate cryptographically secure random passwords and UUID v4 identifiers.</p>
      </div>

      {/* Password Card */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <h2 className="text-lg font-bold text-slate-800">Password Generator</h2>

        <div className="flex items-center justify-between p-4 bg-purple-50/50 rounded-xl border border-purple-100">
          <span className="font-mono text-lg font-bold text-slate-800 tracking-wider break-all">
            {password}
          </span>
          <button
            onClick={handleCopyPass}
            className="ml-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-colors flex-shrink-0"
          >
            {copiedPass ? 'Copied! ✓' : 'Copy'}
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-600 mb-2">
              <span>Length: {length} characters</span>
            </div>
            <input
              type="range"
              min="8"
              max="64"
              value={length}
              onChange={(e) => setLength(e.target.value)}
              className="w-full accent-purple-600"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'ABC (Uppercase)', val: includeUppercase, set: setIncludeUppercase },
              { label: '123 (Numbers)', val: includeNumbers, set: setIncludeNumbers },
              { label: '#$& (Symbols)', val: includeSymbols, set: setIncludeSymbols },
            ].map((opt) => (
              <label key={opt.label} className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl cursor-pointer border border-slate-100 hover:bg-slate-100">
                <input
                  type="checkbox"
                  checked={opt.val}
                  onChange={(e) => opt.set(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <span className="text-xs font-medium text-slate-700">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={handleGeneratePassword}
          className="w-full btn btn-primary py-3.5 rounded-xl font-bold"
        >
          Generate New Password
        </button>
      </div>

      {/* UUID Card */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-800">UUID v4 Generator</h2>
        
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
          <span className="font-mono text-sm font-semibold text-slate-700">
            {uuid}
          </span>
          <button
            onClick={handleCopyUuid}
            className="ml-4 px-4 py-2 border border-slate-300 hover:bg-white text-slate-700 rounded-lg text-xs font-bold transition-colors"
          >
            {copiedUuid ? 'Copied! ✓' : 'Copy'}
          </button>
        </div>

        <button
          onClick={() => setUuid(generateUuid())}
          className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors"
        >
          Generate New UUID
        </button>
      </div>
    </div>
  );
}
