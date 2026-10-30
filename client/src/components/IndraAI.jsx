import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, X, Send, Sparkles, FileText, Image as ImageIcon, Wrench, LoaderCircle } from 'lucide-react';
import { tools as toolDefinitions } from '../services/toolDefinitions';
import apiBase from '../services/apiBase';

const toolAliases = {
  'merge-pdf': ['combine pdf', 'join pdf', 'put pdfs together'],
  'split-pdf': ['separate pdf', 'extract pdf pages', 'split pages'],
  'compress-pdf': ['make pdf smaller', 'reduce pdf size', 'shrink pdf'],
  'reorder-pdf': ['rearrange pdf pages', 'organize pdf pages'],
  'remove-pages': ['delete pdf pages', 'remove pages from pdf'],
  'sign-pdf': ['add signature to pdf', 'sign document'],
  'pdf-to-images': ['convert pdf pages to images', 'pdf to jpg', 'pdf to png'],
  'images-to-pdf': ['combine images into pdf', 'photos to pdf', 'jpg to pdf'],
  'pdf-to-markdown': ['convert pdf to markdown'],
  'pdf-to-text': ['extract text from pdf', 'pdf text extractor'],
  'text-to-pdf': ['create pdf from text', 'save text as pdf'],
  'pdf-to-word': ['convert pdf to docx', 'pdf to doc'],
  'word-to-pdf': ['convert docx to pdf', 'doc to pdf'],
  'word-to-powerpoint': ['word to ppt', 'docx to powerpoint', 'docx to pptx'],
  'compress-image': ['make image smaller', 'reduce image size', 'shrink image'],
  'convert-image': ['png to jpg', 'jpg to png', 'webp to png', 'image format'],
  'resize-image': ['change image size', 'change photo dimensions'],
  'image-collage': ['photo collage', 'combine photos'],
  'photo-editor': ['edit photo', 'edit image'],
  'ocr-image': ['ocr', 'extract text from image', 'read text in photo'],
  'ocr-extractor': ['ocr', 'extract text from scan', 'image text extractor'],
  'ocr-pdf': ['ocr', 'extract text from scanned pdf', 'read scanned pdf'],
  'word-counter': ['count words', 'count characters'],
  'json-formatter': ['format json', 'validate json', 'beautify json'],
  'qr-generator': ['make qr code', 'create qr code'],
  'url-shortener': [
    'url shortener', 'url shortner', 'link shortener', 'link shortner',
    'shorten url', 'shorten link', 'short url', 'make short link',
    'make url shorter', 'shorten this url', 'shorten this link',
  ],
  'utm-builder': ['campaign tracking url', 'add utm tags'],
  'url-encoder': ['encode url', 'decode url', 'percent encode'],
  'csv-json-converter': ['csv to json', 'json to csv'],
  'csv-to-excel': ['csv to xlsx', 'csv to spreadsheet'],
  'excel-to-csv': ['xlsx to csv', 'spreadsheet to csv', 'export excel to csv'],
  'background-remover': ['remove background', 'remove image background', 'background remover', 'transparent background', 'make background transparent'],
  'base64-converter': ['encode base64', 'decode base64'],
  'password-generator': ['generate password', 'create password', 'generate uuid'],
};

const categoryPath = {
  PDF: 'pdf',
  Image: 'image',
  Utility: 'utility',
  Utilities: 'utility',
};

const toolLinks = toolDefinitions.map((tool) => ({
  ...tool,
  path: tool.category === 'Convert'
    ? `/convert/${tool.id}`
    : `/tools/${categoryPath[tool.category] || 'utility'}/${tool.engine || tool.id}`,
  keywords: [tool.name, tool.id, tool.engine, tool.description, tool.category, ...(toolAliases[tool.id] || [])]
    .filter(Boolean)
    .map(normalizeText),
}));

function normalizeText(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function phraseMatchScore(queryText, keyword) {
  const queryWords = queryText.trim().split(/\s+/);
  const keywordWords = keyword.split(' ');
  if (keywordWords.length === 1) {
    return queryWords.includes(keywordWords[0]) ? keyword.length + 10 : 0;
  }

  if (queryWords.length === 1) {
    return keywordWords.includes(queryWords[0]) ? keyword.length + 10 : 0;
  }

  let bestScore = 0;
  for (let start = 0; start < queryWords.length; start += 1) {
    if (queryWords[start] !== keywordWords[0]) continue;
    let position = start;
    let gaps = 0;
    let matched = true;
    for (let part = 1; part < keywordWords.length; part += 1) {
      let next = position + 1;
      while (next < queryWords.length && next <= position + 3 && queryWords[next] !== keywordWords[part]) next += 1;
      if (next >= queryWords.length || next > position + 3) {
        matched = false;
        break;
      }
      gaps += next - position - 1;
      position = next;
    }
    if (matched) bestScore = Math.max(bestScore, keyword.length * 10 - gaps * 5);
  }
  return bestScore;
}

function findTools(query) {
  const text = normalizeText(query);
  const direct = toolLinks.map((tool) => {
    const score = tool.keywords.reduce((best, keyword) => {
      if (!keyword) return best;
      return Math.max(best, phraseMatchScore(text, keyword));
    }, 0);
    return { tool, score };
  }).filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ tool }) => tool);
  if (direct.length) return direct;

  const normalizedQuery = normalizeText(query);
  const categories = [];
  if (/pdf|document|page/.test(normalizedQuery)) categories.push('PDF');
  if (/image|photo|picture|png|jpg/.test(normalizedQuery)) categories.push('Image');
  if (/text|json|csv|qr|password|utility|url|excel|word|powerpoint|spreadsheet/.test(normalizedQuery)) categories.push('Utility', 'Utilities', 'Convert');
  const matches = toolLinks.filter((tool) => categories.includes(tool.category));
  return matches.slice(0, 3);
}

function getReply(query, matches) {
  if (/how|help|what|which|can you|i need/.test(query.toLowerCase()) && !matches.length) {
    return 'Tell me what you want to do with a PDF, image, or text file, and I’ll point you to the right tool.';
  }
  if (matches.length === 1) return `You can use ${matches[0].name}. Open it here:`;
  if (matches.length > 1) return 'These tools look like a good match. Choose one to open its workspace:';
  return 'I couldn’t find an exact match. Try “split a PDF”, “resize an image”, or browse all tools.';
}

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ id: 'welcome', text: 'Hi! I can help you find the right PDF, image, or utility tool. What are you trying to do?', sender: 'ai' }]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [geminiEnabled, setGeminiEnabled] = useState(false);
  const messagesEndRef = useRef(null);
  const suggestions = useMemo(() => [
    { icon: FileText, label: 'Split a PDF', prompt: 'I want to split a PDF' },
    { icon: ImageIcon, label: 'Resize an image', prompt: 'I want to resize an image' },
    { icon: Wrench, label: 'Find a utility', prompt: 'Show me a useful text utility' },
  ], []);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages, isThinking]);
  useEffect(() => {
    let active = true;
    fetch(`${apiBase}/ai/status`).then(response => response.ok ? response.json() : null)
      .then(result => { if (active) setGeminiEnabled(result?.enabled === true); })
      .catch(() => { if (active) setGeminiEnabled(false); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event) => { if (event.key === 'Escape') setIsOpen(false); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  const sendMessage = async (value) => {
    const query = value.trim();
    if (!query || isThinking) return;
    const matches = findTools(query);
    setMessages((current) => [...current, { id: `${Date.now()}-user`, text: query, sender: 'user' }]);
    setInput('');
    setIsThinking(true);
    let reply = getReply(query, matches);
    let selectedTools = matches;
    if (geminiEnabled) {
      try {
        const response = await fetch(`${apiBase}/ai/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: query }),
        });
        if (!response.ok) throw new Error('AI chat unavailable');
        const result = await response.json();
        if (typeof result.reply === 'string' && result.reply.trim()) reply = result.reply.trim();
        if (Array.isArray(result.toolIds)) {
          const aiMatches = result.toolIds
            .map((id) => toolLinks.find((tool) => tool.id === id))
            .filter(Boolean);
          if (aiMatches.length) selectedTools = aiMatches;
        }
      } catch {
        reply = `${getReply(query, matches)} (AI is unavailable right now, so I used the local tool finder.)`;
      }
    }
    setMessages((current) => [...current, { id: `${Date.now()}-ai`, text: reply, sender: 'ai', tools: selectedTools }]);
    setIsThinking(false);
  };

  return <>
    <button type="button" aria-label="Open FileWiz assistant" aria-expanded={isOpen} onClick={() => setIsOpen(true)} className={`fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-[60] grid h-14 w-14 place-items-center rounded-full bg-purple-main text-white shadow-xl transition hover:scale-105 md:bottom-6 md:right-6 ${isOpen ? 'pointer-events-none scale-0 opacity-0' : ''}`}>
      <Bot size={26} /><span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-emerald-500 text-[10px]">●</span>
    </button>

    <section role="dialog" aria-modal="true" aria-label="FileWiz Assistant" className={`fixed inset-x-2 bottom-[max(.5rem,env(safe-area-inset-bottom))] z-[70] flex h-[min(620px,calc(100dvh-1rem))] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl transition duration-200 sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[min(620px,calc(100dvh-3rem))] sm:w-[min(400px,calc(100vw-2rem))] ${isOpen ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-5 opacity-0'}`}>
      <header className="flex shrink-0 items-center justify-between bg-[linear-gradient(135deg,var(--color-purple-main),var(--color-purple-light))] px-4 py-3 text-white sm:p-4">
        <div className="flex min-w-0 items-center gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/20"><Sparkles size={20}/></div><div className="min-w-0"><h2 className="truncate text-base font-bold text-white">FileWiz Assistant</h2><p className="text-xs text-white/80">{geminiEnabled ? 'Gemini AI · messages are sent to Google' : 'Private tool finder · files stay on your device'}</p></div></div>
        <button type="button" aria-label="Close assistant" onClick={() => setIsOpen(false)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-0 bg-white/10 text-white"><X size={21}/></button>
      </header>
      <div className="flex-1 space-y-3 overflow-y-auto overscroll-contain bg-slate-50 p-3 sm:p-4" aria-live="polite">
        {messages.map((message) => <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-[88%] rounded-2xl p-3 text-sm leading-relaxed shadow-sm ${message.sender === 'user' ? 'rounded-br-sm bg-purple-main text-white' : 'rounded-bl-sm border border-slate-200 bg-white text-slate-800'}`}>
            <p className="whitespace-pre-wrap">{message.text}</p>
            {message.tools?.length > 0 && <div className="mt-2 space-y-2">{message.tools.map((tool) => <Link key={tool.path} onClick={() => setIsOpen(false)} to={tool.path} className="flex min-h-11 items-center justify-between gap-2 rounded-xl border border-purple-100 bg-purple-50 px-3 py-2 font-semibold text-purple-800 hover:border-purple-300 hover:bg-purple-100"><span>{tool.name}</span><span className="text-xs font-medium text-purple-600">Open →</span></Link>)}</div>}
          </div>
        </div>)}
        {messages.length === 1 && <div className="flex flex-wrap gap-2">{suggestions.map(({ icon: Icon, label, prompt }) => <button key={prompt} type="button" onClick={() => sendMessage(prompt)} className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-purple-200 bg-white px-3 py-2 text-xs font-medium text-purple-800"><Icon size={14}/>{label}</button>)}</div>}
        {isThinking && <div className="flex items-center gap-2 text-xs text-slate-500"><LoaderCircle className="animate-spin" size={15}/>Finding the best tool…</div>}
        <div ref={messagesEndRef}/>
      </div>
      {geminiEnabled && <p className="shrink-0 bg-amber-50 px-3 py-1.5 text-center text-[11px] text-amber-900">Don’t include passwords or private document details. <Link to="/privacy" onClick={() => setIsOpen(false)} className="underline">Privacy details</Link></p>}
      <form onSubmit={(event) => { event.preventDefault(); sendMessage(input); }} className="flex shrink-0 items-center gap-2 border-t border-slate-200 bg-white p-3 pb-[max(.75rem,env(safe-area-inset-bottom))] sm:p-4">
        <label htmlFor="filewiz-assistant-input" className="sr-only">Describe what you need</label>
        <input id="filewiz-assistant-input" value={input} onChange={(event) => setInput(event.target.value)} placeholder="e.g. split a PDF" maxLength={300} className="min-w-0 flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-base outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100" />
        <button type="submit" aria-label="Send message" disabled={!input.trim() || isThinking} className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-0 bg-purple-main text-white disabled:bg-slate-300"><Send size={17}/></button>
      </form>
    </section>
  </>;
}
