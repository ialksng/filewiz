import { useEffect, useRef } from 'react';

const GIS_URL = 'https://accounts.google.com/gsi/client';

export default function GoogleSignInButton({ onCredential, onError, disabled = false }) {
  const containerRef = useRef(null);
  const callbacksRef = useRef({ onCredential, onError });
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    callbacksRef.current = { onCredential, onError };
  }, [onCredential, onError]);

  useEffect(() => {
    if (!clientId || !containerRef.current) return undefined;
    let disposed = false;
    const render = () => {
      if (disposed || !containerRef.current || !window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: ({ credential }) => {
          if (credential) callbacksRef.current.onCredential(credential);
          else callbacksRef.current.onError('Google did not return a sign-in credential.');
        },
        cancel_on_tap_outside: true,
      });
      containerRef.current.replaceChildren();
      window.google.accounts.id.renderButton(containerRef.current, {
        type: 'standard', shape: 'rectangular', theme: 'outline', size: 'large',
        text: 'continue_with', logo_alignment: 'left', width: Math.min(containerRef.current.clientWidth || 360, 360),
      });
    };

    const existing = document.querySelector(`script[src="${GIS_URL}"]`);
    if (window.google?.accounts?.id) render();
    else if (existing) existing.addEventListener('load', render, { once: true });
    else {
      const script = document.createElement('script');
      script.src = GIS_URL;
      script.async = true;
      script.defer = true;
      script.onload = render;
      script.onerror = () => callbacksRef.current.onError('Google sign-in could not load. Check your connection and client ID settings.');
      document.head.append(script);
    }
    return () => {
      disposed = true;
      existing?.removeEventListener('load', render);
    };
  }, [clientId]);

  if (!clientId) return <p className="text-center text-xs text-slate-500">Google sign-in is unavailable until VITE_GOOGLE_CLIENT_ID is set.</p>;
  return <div aria-disabled={disabled} className={disabled ? 'pointer-events-none opacity-50' : ''} ref={containerRef} />;
}
