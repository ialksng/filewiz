import { useState } from 'react';
import { analyzeText } from '../../../services/utilityEngine';

export default function WordCounter() {
  const [text, setText] = useState('');
  const stats = analyzeText(text);

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Word & Character Counter</h1>
        <p className="text-slate-500 mt-1">Real-time stats, character counts, sentences, and estimated reading time.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Words', val: stats.words },
          { label: 'Characters', val: stats.characters },
          { label: 'No Spaces', val: stats.charactersNoSpaces },
          { label: 'Sentences', val: stats.sentences },
          { label: 'Paragraphs', val: stats.paragraphs },
          { label: 'Reading Time', val: `${stats.readingTimeMinutes} min` },
        ].map((item) => (
          <div key={item.label} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{item.label}</p>
            <p className="text-2xl font-black text-purple-700 mt-1">{item.val}</p>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <textarea
          rows={10}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste or write your text here..."
          className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/10 text-sm leading-relaxed"
        />

        <div className="flex justify-between items-center text-xs text-slate-400">
          <span>Real-time instant calculation</span>
          {text && (
            <button
              onClick={() => setText('')}
              className="text-red-500 hover:text-red-700 font-semibold"
            >
              Clear Text
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
