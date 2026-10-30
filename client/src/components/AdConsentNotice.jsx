import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdConsent, saveAdConsent, AD_CONSENT_CHANGE, OPEN_AD_PREFERENCES } from '../services/adConsent';

export default function AdConsentNotice() {
  const [choice, setChoice] = useState(getAdConsent);
  const [open, setOpen] = useState(() => getAdConsent() === null);

  useEffect(() => {
    const onChange = event => {
      const next = event.detail;
      setChoice(next);
      setOpen(next == null);
    };
    const onOpen = () => setOpen(true);
    window.addEventListener(AD_CONSENT_CHANGE, onChange);
    window.addEventListener(OPEN_AD_PREFERENCES, onOpen);
    return () => {
      window.removeEventListener(AD_CONSENT_CHANGE, onChange);
      window.removeEventListener(OPEN_AD_PREFERENCES, onOpen);
    };
  }, []);

  if (!open) return null;
  return <aside aria-label="FileWiz plan options" className="fixed inset-x-3 bottom-3 z-[120] mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:inset-x-5 sm:p-5">
    <p className="font-semibold text-slate-900">Choose how to use FileWiz</p>
    <p className="mt-1 text-sm leading-5 text-slate-600">Keep ads on the free plan, or upgrade to Premium to remove ads while your subscription is active. Ad partners may receive your IP address, browser details, and page context, and may use cookies for ad delivery and measurement. <Link className="font-medium text-violet-700 underline" to="/privacy">Privacy details</Link>.</p>
    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
      <button type="button" onClick={() => saveAdConsent('allowed')} className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Keep ads</button>
      <Link to="/pricing" onClick={() => setOpen(false)} className="min-h-11 rounded-xl bg-violet-700 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-violet-800">Go Premium to remove ads</Link>
    </div>
  </aside>;
}
