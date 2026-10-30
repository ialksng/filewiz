import { useEffect, useRef, useState } from 'react';

const CONFIG_SCRIPT_ID = 'filewiz-adsterra-banner-config';
const AD_SCRIPT_ID = 'filewiz-adsterra-banner-script';
const parkedAdNodes = {
  desktop: document.createDocumentFragment(),
  mobile: document.createDocumentFragment(),
};
const loadedAdUnits = new Set();
const adLoadAttempts = new Map();
let activeAdUnit = null;

const adUnitCode = {
  desktop: {
    key: 'dec100b458e9f900b62836c2b28628c8',
    width: 468,
    height: 60,
    src: 'https://bauval.org/22/dec100b458e9f900b62836c2b28628c8',
  },
  mobile: {
    key: '842ec6c8d1e6300c25763ed39e2aac93',
    width: 320,
    height: 50,
    src: 'https://bauval.org/22/842ec6c8d1e6300c25763ed39e2aac93',
  },
};

export default function AdvertisementBanner({ enabled, consented }) {
  const slotRef = useRef(null);
  const [wasActivated, setWasActivated] = useState(false);
  const [adRetry, setAdRetry] = useState(0);
  const [isNarrowScreen, setIsNarrowScreen] = useState(() => window.matchMedia('(max-width: 500px)').matches);
  const activeUnit = isNarrowScreen ? 'mobile' : 'desktop';

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 500px)');
    const updateScreenSize = (event) => setIsNarrowScreen(event.matches);
    mediaQuery.addEventListener('change', updateScreenSize);
    return () => mediaQuery.removeEventListener('change', updateScreenSize);
  }, []);

  useEffect(() => {
    if (!enabled || document.getElementById('filewiz-adsterra-preconnect')) return undefined;

    const preconnect = document.createElement('link');
    preconnect.id = 'filewiz-adsterra-preconnect';
    preconnect.rel = 'preconnect';
    preconnect.href = 'https://bauval.org';
    preconnect.crossOrigin = 'anonymous';
    document.head.append(preconnect);

    return () => preconnect.remove();
  }, [enabled]);

  useEffect(() => {
    const slot = slotRef.current;
    if (!slot) return;

    if (!consented) {
      for (const unit of Object.keys(parkedAdNodes)) {
        parkedAdNodes[unit].replaceChildren();
        loadedAdUnits.delete(unit);
        adLoadAttempts.delete(unit);
      }
      while (slot.firstChild) slot.firstChild.remove();
      activeAdUnit = null;
      return;
    }

    if (!enabled) {
      if (activeAdUnit) {
        while (slot.firstChild) parkedAdNodes[activeAdUnit].append(slot.firstChild);
        activeAdUnit = null;
      }
      return;
    }

    if (activeAdUnit === activeUnit && loadedAdUnits.has(activeUnit)) return;
    if (activeAdUnit) {
      while (slot.firstChild) parkedAdNodes[activeAdUnit].append(slot.firstChild);
      activeAdUnit = null;
    }

    if (parkedAdNodes[activeUnit].childNodes.length) {
      slot.append(parkedAdNodes[activeUnit]);
    } else if (!loadedAdUnits.has(activeUnit)) {
      const adUnit = adUnitCode[activeUnit];
      const unitName = activeUnit;
      const configScript = document.createElement('script');
      configScript.id = `${CONFIG_SCRIPT_ID}-${activeUnit}`;
      configScript.text = ` atOptions = {
   'key' : '${adUnit.key}',
   'format' : 'iframe',
   'height' : ${adUnit.height},
   'width' : ${adUnit.width},
   'params' : {}
 };
`;

      const adScript = document.createElement('script');
      adScript.id = `${AD_SCRIPT_ID}-${activeUnit}`;
      adScript.src = adUnit.src;
      adScript.async = true;
      adScript.onload = () => {
        loadedAdUnits.add(unitName);
        adLoadAttempts.delete(unitName);
      };
      adScript.onerror = () => {
        const failedUnit = unitName;
        configScript.remove();
        adScript.remove();
        loadedAdUnits.delete(failedUnit);

        const attempts = adLoadAttempts.get(failedUnit) || 0;
        if (attempts < 1) {
          adLoadAttempts.set(failedUnit, attempts + 1);
          window.setTimeout(() => setAdRetry((value) => value + 1), 1200);
        }
      };
      slotRef.current.append(configScript, adScript);
    }

    activeAdUnit = activeUnit;
    setWasActivated(true);
  }, [enabled, activeUnit, adRetry, consented]);

  useEffect(() => () => {
    if (!slotRef.current || !activeAdUnit) return;
    while (slotRef.current.firstChild) parkedAdNodes[activeAdUnit].append(slotRef.current.firstChild);
    activeAdUnit = null;
  }, []);

  if (!enabled && !wasActivated) return null;

  return (
    <section
      aria-label="Advertisement"
      className={`filewiz-advertisement ${enabled ? '' : 'filewiz-advertisement-hidden'}`}
    >
      <p className="filewiz-advertisement-label">Advertisement</p>
      <div ref={slotRef} data-ad-size={activeUnit} className="filewiz-advertisement-slot" />
    </section>
  );
}
