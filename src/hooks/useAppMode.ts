import { useEffect, useState } from 'react';

export interface AppModeState {
  isStandalone: boolean;
  isMobileDevice: boolean;
  isPreviewMobileMode: boolean;
  isMobileInstalledApp: boolean;
}

function detectStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = window.navigator as unknown as { standalone?: boolean };
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    nav.standalone === true
  );
}

function detectMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  const isMobileUA = /android|iphone|ipad|ipod|webos|blackberry|iemobile|opera mini/.test(ua);
  // iPadOS 13+ reports Macintosh in UA but has MacIntel platform + multi-touch points
  const isIPadOS =
    window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1;
  const navWithUAData = window.navigator as unknown as {
    userAgentData?: { mobile?: boolean };
  };
  const isUADataMobile = navWithUAData.userAgentData?.mobile === true;

  return isMobileUA || isIPadOS || isUADataMobile;
}

function detectPreviewMobileParam(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get('mode') === 'mobile';
  } catch {
    return false;
  }
}

export function useAppMode(): AppModeState {
  const [isStandalone, setIsStandalone] = useState<boolean>(() => detectStandalone());
  const [isMobileDevice] = useState<boolean>(() => detectMobileDevice());
  const [isPreviewMobileMode] = useState<boolean>(() => detectPreviewMobileParam());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(display-mode: standalone)');
    const updateStandalone = () => setIsStandalone(detectStandalone());

    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', updateStandalone);
      return () => mql.removeEventListener('change', updateStandalone);
    }
    return undefined;
  }, []);

  const isMobileInstalledApp = (isStandalone && isMobileDevice) || isPreviewMobileMode;

  return {
    isStandalone,
    isMobileDevice,
    isPreviewMobileMode,
    isMobileInstalledApp,
  };
}
