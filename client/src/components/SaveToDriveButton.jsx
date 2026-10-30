import { useEffect, useState } from 'react';
import { CloudUpload } from 'lucide-react';
import { prepareGoogleDrive, requestGoogleDriveAccessToken, saveBlobToGoogleDrive } from '../utils/googleDrive';
import { usePremium } from '../context/premiumContextStore';
import { Link } from 'react-router-dom';

export default function SaveToDriveButton({ blob, filename, className = '' }) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [driveLink, setDriveLink] = useState('');
  const [driveReady, setDriveReady] = useState(false);
  const { tier, loading: planLoading } = usePremium();

  useEffect(() => {
    let current = true;
    prepareGoogleDrive().then(ready => {
      if (current) setDriveReady(ready);
    }).catch(() => {
      if (current) setMessage('Google Drive could not be loaded. Check your connection and retry.');
    });
    return () => { current = false; };
  }, []);

  const saveToDrive = async () => {
    if (!blob || saving) return;
    setSaving(true);
    setMessage('');
    setDriveLink('');
    try {
      if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
        throw new Error('Google Drive saving is not configured yet. Add VITE_GOOGLE_CLIENT_ID to the Vercel environment and redeploy.');
      }
      const tokenPromise = requestGoogleDriveAccessToken();
      const accessToken = await tokenPromise;
      const file = await saveBlobToGoogleDrive(blob, filename, accessToken);
      setMessage('Saved to Google Drive.');
      setDriveLink(file.webViewLink || '');
    } catch (error) {
      setMessage(error.message || 'Could not save to Google Drive.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {tier !== 'premium' ? <Link to="/pricing" className="btn btn-outline w-full justify-center gap-2"><CloudUpload size={18} aria-hidden="true"/>Save to Drive · Premium</Link> : <>
      <button type="button" onClick={saveToDrive} disabled={!blob || saving || (!!import.meta.env.VITE_GOOGLE_CLIENT_ID && !driveReady)} className="btn btn-outline w-full justify-center gap-2 disabled:opacity-60">
        <CloudUpload size={18} aria-hidden="true" />
        {saving ? 'Saving to Google Drive…' : 'Save to Google Drive'}
      </button>
      {!message && <p className="mt-2 text-center text-xs text-slate-500">The selected result is sent directly to your Google Drive after you authorize it.</p>}
      {message && <p className="mt-2 text-center text-sm text-slate-600" role="status">{message}</p>}
      {driveLink && <a className="mt-1 block text-center text-sm font-semibold text-purple-700 underline" href={driveLink} target="_blank" rel="noreferrer">Open in Google Drive</a>}
      </>}
      {tier !== 'premium' && <p className="mt-2 text-center text-xs text-slate-500">{planLoading ? 'Checking your plan…' : 'Save results to Google Drive with FileWiz Premium.'}</p>}
    </div>
  );
}
