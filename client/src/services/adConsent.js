const CONSENT_KEY = 'filewiz-ad-consent-v1';
export const AD_CONSENT_CHANGE = 'filewiz:ad-consent-change';
export const OPEN_AD_PREFERENCES = 'filewiz:open-ad-preferences';

export function getAdConsent() {
  try {
    const value = localStorage.getItem(CONSENT_KEY);
    // Older versions let users reject ads. Re-prompt those users with the
    // current two-plan choice rather than silently restoring or disabling ads.
    return value === 'allowed' ? value : null;
  } catch {
    return null;
  }
}

export function saveAdConsent(value) {
  try { localStorage.setItem(CONSENT_KEY, value); } catch { /* Ads remain opt-in if storage is unavailable. */ }
  window.dispatchEvent(new CustomEvent(AD_CONSENT_CHANGE, { detail: value }));
}
