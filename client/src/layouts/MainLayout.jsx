import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AIChatbot from '../components/IndraAI';
import Loader from '../components/Loader';
import { useLoader } from '../context/LoaderContext';
import AdvertisementBanner from '../components/AdvertisementBanner';
import DriveSaveToast from '../components/DriveSaveToast';
import AdConsentNotice from '../components/AdConsentNotice';
import { getAdConsent, AD_CONSENT_CHANGE } from '../services/adConsent';
import { usePremium } from '../context/premiumContextStore';
import { useEffect, useState } from 'react';

function isAdEligiblePath(pathname) {
  // Keep ad placement after all tool routes, including the standalone FileWiz
  // PDF, image, utility, and conversion URLs. Account and policy routes stay out.
  return /^\/tools\/[^/]+(?:\/|$)/.test(pathname)
    || pathname === '/workspace'
    || /^\/(?:convert|pdf|image|utility)\/[^/]+\/?$/.test(pathname);
}

export default function MainLayout() {
  const { isLoading } = useLoader();
  const { pathname } = useLocation();
  const [adConsent, setAdConsent] = useState(getAdConsent);
  const { tier, loading: planLoading } = usePremium();

  useEffect(() => {
    const updateConsent = event => setAdConsent(event.detail ?? getAdConsent());
    window.addEventListener(AD_CONSENT_CHANGE, updateConsent);
    return () => window.removeEventListener(AD_CONSENT_CHANGE, updateConsent);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white relative">
      <Navbar />
      
      {/* Global Loader Overlay - active only when explicitly triggered */}
      {isLoading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/70 backdrop-blur-sm transition-all duration-300">
          <Loader />
        </div>
      )}

      <main className="flex-grow flex flex-col pb-32">
        <Outlet />
      </main>

      <AdvertisementBanner enabled={!planLoading && tier !== 'premium' && isAdEligiblePath(pathname) && adConsent === 'allowed'} consented={adConsent === 'allowed'} />
      {!planLoading && tier !== 'premium' && <AdConsentNotice />}
      
      <Footer />
      <AIChatbot />
      <DriveSaveToast />
    </div>
  );
}
