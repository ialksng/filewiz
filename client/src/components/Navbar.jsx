import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, User, LogOut, Download, FolderOpen, ShieldCheck } from 'lucide-react';
import { usePremium } from '../context/premiumContextStore';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isAdmin } = usePremium();
  const { user, logout } = useAuth();

  const toolCategories = [
    { name: 'PDF', path: '/tools/pdf' },
    { name: 'Images', path: '/tools/image' },
    { name: 'Utilities', path: '/tools/utility' },
    { name: 'File Conversions', path: '/tools/convert' },
  ];

  useEffect(() => {
    const captureInstall = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    window.addEventListener('beforeinstallprompt', captureInstall);
    return () => window.removeEventListener('beforeinstallprompt', captureInstall);
  }, []);

  const installApp = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    setInstallPrompt(null);
  };

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsToolsMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-lg border-b border-slate-200 transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Keep the existing FileWiz logo as the single brand mark. */}
        <Link to="/" className="flex items-center gap-3 cursor-pointer group">
          <img
            src={`${import.meta.env.BASE_URL}logoWRB.png`}
            alt="FileWiz"
            className="h-12 w-auto max-w-44 object-contain transition-transform group-hover:scale-[1.03]"
          />
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/" aria-current={pathname === '/' ? 'page' : undefined} className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${pathname === '/' ? 'bg-violet-50 text-violet-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>Home</Link>
          <Link to="/workspace" aria-current={pathname === '/workspace' ? 'page' : undefined} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${pathname === '/workspace' ? 'bg-violet-50 text-violet-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}><FolderOpen size={16}/> Workspace</Link>
          {isAdmin && <Link to="/admin" aria-current={pathname === '/admin' ? 'page' : undefined} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"><ShieldCheck size={16}/> Admin</Link>}
          <div className="relative">
            <button type="button" aria-expanded={isToolsMenuOpen} onClick={() => setIsToolsMenuOpen(open => !open)} className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${pathname.startsWith('/tools') || pathname.startsWith('/convert') ? 'bg-violet-50 text-violet-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
              Tools <ChevronDown size={15} className={`transition-transform ${isToolsMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {isToolsMenuOpen && <div className="absolute left-0 top-full z-50 mt-3 w-52 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
              {toolCategories.map(link => <Link key={link.path} to={link.path} onClick={() => setIsToolsMenuOpen(false)} className="block rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-purple-50 hover:text-purple-700">{link.name}</Link>)}
            </div>}
          </div>
          <Link to="/pricing" aria-current={pathname === '/pricing' ? 'page' : undefined} className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${pathname === '/pricing' ? 'bg-violet-50 text-violet-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>Pricing</Link>
        </div>

        {/* Right side Buttons */}
        <div className="hidden md:flex items-center gap-4">
          {installPrompt && <button onClick={installApp} className="btn btn-outline px-4 py-2 text-sm"><Download size={15}/> Install app</button>}
          {user ? (
            <>
              <Link to="/dashboard" className="text-slate-600 hover:text-purple-600 font-medium text-sm transition-colors flex items-center gap-2">
                <User size={16} /> Dashboard
              </Link>
              <button 
                onClick={handleLogout} 
                className="btn btn-outline px-4 py-2 text-xs flex items-center gap-2 text-red-500 hover:bg-red-50 border-red-200"
              >
                <LogOut size={14} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-primary px-4 py-2 text-sm shadow-sm">
                Login
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="rounded-xl p-2 text-slate-700 transition hover:bg-slate-100 md:hidden"
          aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isMobileMenuOpen}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute left-0 top-16 w-full border-b border-slate-200 bg-white p-4 shadow-lg sm:p-6 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
          <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-medium text-slate-700 py-2 border-b border-slate-100">Home</Link>
          <Link to="/workspace" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2 text-base font-medium text-slate-700 py-2 border-b border-slate-100"><FolderOpen size={17}/> Workspace</Link>
          {isAdmin && <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2 text-base font-medium text-slate-700 py-2 border-b border-slate-100"><ShieldCheck size={17}/> Admin</Link>}
          <div className="border-b border-slate-100 pb-2">
            <button type="button" aria-expanded={isToolsMenuOpen} onClick={() => setIsToolsMenuOpen(open => !open)} className="flex w-full items-center justify-between py-2 text-left text-base font-medium text-slate-700">
              Tools <ChevronDown size={16} className={`transition-transform ${isToolsMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {isToolsMenuOpen && <div className="mt-1 grid gap-1 pl-3">
              {toolCategories.map(link => <Link key={link.path} to={link.path} onClick={() => { setIsMobileMenuOpen(false); setIsToolsMenuOpen(false); }} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-purple-50 hover:text-purple-700">{link.name}</Link>)}
            </div>}
          </div>
          <Link to="/pricing" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-medium text-slate-700 py-2 border-b border-slate-100">Pricing</Link>
          <div className="flex flex-col gap-3 mt-4">
            {installPrompt && <button onClick={installApp} className="btn btn-outline w-full justify-center" aria-label="Install FileWiz app"><Download size={16}/> Install app</button>}
            {user ? (
              <>
                <Link to="/dashboard" className="btn btn-primary w-full justify-center" onClick={() => setIsMobileMenuOpen(false)}>Dashboard</Link>
                <button onClick={handleLogout} className="btn btn-outline w-full justify-center text-red-500 border-red-200">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-primary w-full justify-center text-sm" onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
