import { Link } from 'react-router-dom';
import { Wand2 } from 'lucide-react';
import { OPEN_AD_PREFERENCES } from '../services/adConsent';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-slate-200 pt-16 pb-8 mt-16">
      <div className="max-w-[1200px] mx-auto px-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-16">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 text-2xl font-bold font-heading text-slate-900 mb-3">
              <Wand2 className="text-purple-600" size={24} />
              FileWiz
            </Link>
            <p className="text-slate-500 leading-relaxed mb-6 max-w-sm text-sm">
              Simple tools for PDFs, images, and everyday files. Many tools process locally in your browser; cloud-powered features explain when a file is sent to a service.
            </p>
          </div>

          {/* Links Columns */}
          <div>
            <h4 className="font-heading font-semibold text-slate-900 mb-4 text-sm">PDF Utilities</h4>
            <ul className="flex flex-col gap-2.5 text-sm text-slate-500">
              <li><Link to="/tools/pdf/merge-pdf" className="hover:text-purple-600 transition-colors">Merge PDF</Link></li>
              <li><Link to="/tools/pdf/split-pdf" className="hover:text-purple-600 transition-colors">Split PDF</Link></li>
              <li><Link to="/tools/pdf/compress-pdf" className="hover:text-purple-600 transition-colors">Compress PDF</Link></li>
              <li><Link to="/tools/pdf/rotate-pdf" className="hover:text-purple-600 transition-colors">Rotate PDF</Link></li>
              <li><Link to="/tools/pdf/add-watermark" className="hover:text-purple-600 transition-colors">Add Watermark</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-slate-900 mb-4 text-sm">Image & Utilities</h4>
            <ul className="flex flex-col gap-2.5 text-sm text-slate-500">
              <li><Link to="/tools/image/compress-image" className="hover:text-purple-600 transition-colors">Compress Image</Link></li>
              <li><Link to="/tools/image/convert-image" className="hover:text-purple-600 transition-colors">Convert Format</Link></li>
              <li><Link to="/tools/image/create-favicon" className="hover:text-purple-600 transition-colors">Favicon Generator</Link></li>
              <li><Link to="/tools/utility/word-counter" className="hover:text-purple-600 transition-colors">Word Counter</Link></li>
              <li><Link to="/tools/utility/json-formatter" className="hover:text-purple-600 transition-colors">JSON Formatter</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-slate-900 mb-4 text-sm">Company & Legal</h4>
            <ul className="flex flex-col gap-2.5 text-sm text-slate-500">
              <li><Link to="/" className="hover:text-purple-600 transition-colors">FileWiz home</Link></li>
              <li><Link to="/tools" className="hover:text-purple-600 transition-colors">Browse all FileWiz tools</Link></li>
              <li><Link to="/account" className="hover:text-purple-600 transition-colors">My FileWiz account</Link></li>
              <li><Link to="/pricing" className="hover:text-purple-600 transition-colors">Pricing</Link></li>
              <li><Link to="/privacy" className="hover:text-purple-600 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-purple-600 transition-colors">Terms of Service</Link></li>
              <li><button type="button" onClick={() => window.dispatchEvent(new Event(OPEN_AD_PREFERENCES))} className="text-left hover:text-purple-600 transition-colors">Ad preferences</button></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400">
          <p>© {currentYear} FileWiz. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="https://ialksng.me" target="_blank" rel="noreferrer" className="rounded-full border border-slate-200 px-3 py-1.5 font-semibold text-slate-500 transition hover:border-purple-300 hover:text-purple-700">Made by ialksng</a>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Browser tools available
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}
