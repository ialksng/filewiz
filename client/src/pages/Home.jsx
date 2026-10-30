import { useState, useEffect } from "react";
import { Search, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useFile } from "../context/FileContext";
import UploadBox from "../components/UploadBox";
import { getRecentTools } from "../services/recentTools";

export default function Home() {
  const navigate = useNavigate();
  const { setActiveFiles } = useFile();
  const [searchQuery, setSearchQuery] = useState("");
  const [recentTools, setRecentTools] = useState([]);

  useEffect(() => {
    setRecentTools(getRecentTools());
  }, []);

  const popularTools = [
    { name: "Merge PDF", icon: "📑", path: "/tools/pdf/merge-pdf" },
    { name: "Split PDF", icon: "✂️", path: "/tools/pdf/split-pdf" },
    { name: "Compress PDF", icon: "🗜️", path: "/tools/pdf/compress-pdf" },
    { name: "Images to PDF", icon: "🖼️", path: "/tools/pdf/images-to-pdf" },
    { name: "OCR Extractor", icon: "👁️", path: "/tools/utility/ocr-extractor" },
    { name: "Compress Image", icon: "📐", path: "/tools/image/compress-image" },
    { name: "Convert Format", icon: "🔄", path: "/tools/image/convert-image" },
    { name: "QR Generator", icon: "📱", path: "/tools/utility/qr-generator" },
  ];

  const handleFileUpload = (data) => {
    let files = [];
    if (data?.target?.files) {
      files = Array.from(data.target.files);
    } else if (data?.length > 0) {
      files = Array.from(data);
    }

    if (files.length > 0) {
      setActiveFiles(files);
      const first = files[0];
      if (first.type === 'application/pdf' || first.name.endsWith('.pdf')) {
        navigate('/tools/pdf');
      } else if (first.type.startsWith('image/')) {
        navigate('/tools/image');
      } else {
        navigate('/tools/pdf');
      }
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = searchQuery.toLowerCase().trim();
    if (!q) return;

    if (q.includes('merge')) navigate('/tools/pdf/merge-pdf');
    else if (q.includes('split')) navigate('/tools/pdf/split-pdf');
    else if (q.includes('ocr') || q.includes('text extract')) navigate('/tools/utility/ocr-extractor');
    else if (q.includes('compress') && q.includes('image')) navigate('/tools/image/compress-image');
    else if (q.includes('compress')) navigate('/tools/pdf/compress-pdf');
    else if (q.includes('rotate')) navigate('/tools/pdf/rotate-pdf');
    else if (q.includes('watermark')) navigate('/tools/pdf/add-watermark');
    else if (q.includes('convert') || q.includes('png') || q.includes('jpg')) navigate('/tools/image/convert-image');
    else if (q.includes('word') || q.includes('count')) navigate('/tools/utility/word-counter');
    else if (q.includes('json')) navigate('/tools/utility/json-formatter');
    else if (q.includes('base64')) navigate('/tools/utility/base64-converter');
    else if (q.includes('qr')) navigate('/tools/utility/qr-generator');
    else if (q.includes('password') || q.includes('uuid')) navigate('/tools/utility/password-generator');
    else navigate('/tools/pdf');
  };

  return (
    <div className="bg-gradient-to-b from-white to-purple-50/40 min-h-screen font-sans text-slate-900 overflow-hidden">
      <header className="max-w-6xl mx-auto px-6 py-14 lg:py-20">

        {/* HERO */}
        <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center mb-16">

          {/* LEFT */}
          <div className="text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-100/70 text-purple-700 text-xs font-bold mb-6 border border-purple-200">
              <span>✨ The All-in-One Online File Platform by </span>
            </div>

            <h1 className="text-5xl lg:text-6xl font-extrabold mb-6 tracking-tight leading-[1.12]">
              Manage Files Like{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
                Magic
              </span>
            </h1>

            <p className="text-lg text-slate-500 max-w-md mx-auto md:mx-0 leading-relaxed">
              Convert, compress, and edit PDFs and images with browser-based tools. Some standalone utilities use external providers, as described in our privacy policy.
            </p>
          </div>

          {/* RIGHT */}
          <div className="flex flex-col items-center bg-white/60 p-6 rounded-[2rem] shadow-xl shadow-purple-900/5 border border-purple-100/80 backdrop-blur-sm">
            <div className="mb-6 rounded-2xl overflow-hidden bg-slate-100 shadow-inner w-full max-w-[280px]">
              <video
                src={`${import.meta.env.BASE_URL}demo.mp4`}
                autoPlay
                loop
                muted
                playsInline
                className="w-full object-cover"
              />
            </div>

            {/* SEARCH */}
            <form onSubmit={handleSearchSubmit} className="w-full max-w-sm relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400 group-focus-within:text-purple-600 transition-colors" />
              </div>

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tools (merge, ocr, qr)..."
                className="w-full pl-12 pr-24 py-3.5 bg-white border border-slate-200 rounded-2xl outline-none text-sm focus:ring-4 focus:ring-purple-600/10 focus:border-purple-500 transition-all shadow-sm"
              />

              <button 
                type="submit"
                className="absolute right-1.5 top-1.5 bottom-1.5 bg-purple-600 hover:bg-purple-700 text-white px-4 rounded-xl text-xs font-semibold shadow-md shadow-purple-200 transition-colors"
              >
                Go ✨
              </button>
            </form>
          </div>
        </div>

        {/* RECENTLY USED TOOLS (if any) */}
        {recentTools.length > 0 && (
          <div className="mb-12 max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Clock size={14} className="text-purple-600" />
              Recently Used
            </div>
            <div className="flex gap-2.5 overflow-x-auto pb-2">
              {recentTools.map((t) => (
                <button
                  key={t.id}
                  onClick={() => navigate(`/tools/${t.category}/${t.id}`)}
                  className="flex items-center gap-2 px-3.5 py-2 bg-white rounded-xl border border-purple-100 shadow-sm text-xs font-semibold text-slate-700 hover:text-purple-700 hover:border-purple-300 transition-all flex-shrink-0"
                >
                  <span>{t.icon}</span>
                  <span>{t.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* UPLOAD BOX */}
        <div className="flex justify-center mb-16">
          <UploadBox onUpload={handleFileUpload} />
        </div>

        {/* CATEGORY SELECTOR */}
        <div className="flex flex-col items-center mb-16">
          <p className="text-xs uppercase font-bold tracking-widest text-slate-400 mb-4">
            Explore All Tool Suites
          </p>
          <div className="flex gap-3 flex-wrap justify-center max-w-2xl">
            {[
              { label: "PDF Tools", path: "/tools/pdf" },
              { label: "Image Tools", path: "/tools/image" },
              { label: "Everyday Utilities", path: "/tools/utility" },
              { label: "Pricing & Plans", path: "/pricing" }
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className="px-6 py-2.5 bg-white border border-slate-200 rounded-full text-sm font-semibold text-slate-700 hover:text-purple-700 hover:border-purple-300 hover:bg-purple-50 hover:shadow-sm transition-all"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* POPULAR TOOLS GRID */}
        <div className="mb-16">
          <h2 className="text-center font-extrabold text-2xl text-slate-900 mb-8">
            Most Popular Utilities
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {popularTools.map((t) => (
              <div
                key={t.name}
                onClick={() => navigate(t.path)}
                className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-purple-300 hover:shadow-lg hover:shadow-purple-500/5 cursor-pointer transition-all flex flex-col items-center text-center group"
              >
                <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                  {t.icon}
                </span>
                <span className="font-bold text-sm text-slate-800 group-hover:text-purple-600 transition-colors">
                  {t.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* FEATURE STRIP */}
        <div className="flex justify-center">
          <div className="w-full max-w-5xl bg-white/90 backdrop-blur border border-slate-200/80 rounded-3xl shadow-lg shadow-purple-900/5 px-8 py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { title: "Browser-Based File Tools", desc: "Listed file tools process files on your device" },
                { title: "No Sign-up Required", desc: "Instant access to all core tools" },
                { title: "Fast WebAssembly Engine", desc: "Near-instant document conversions" },
                { title: "Mobile & Desktop Ready", desc: "Works seamlessly on all devices" }
              ].map((feature, i) => (
                <div key={i} className="flex flex-col items-center">
                  <p className="font-bold text-sm text-slate-800 mb-1">
                    {feature.title}
                  </p>
                  <p className="text-xs text-slate-500">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </header>
    </div>
  );
}
