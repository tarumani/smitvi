"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ADSENSE_CLIENT,
  ADSENSE_ENABLED,
  isAdSenseAllowedPath,
} from "@/config/adsense";
import {
  CONSENT_CHANGED_EVENT,
  getStoredConsent,
  hasAdvertisingConsent,
} from "@/lib/cookie-consent";

export function AdSenseScriptLoader() {
  const pathname = usePathname();
  const [loadAds, setLoadAds] = useState(false);
  const pathAllowed = isAdSenseAllowedPath(pathname);

  useEffect(() => {
    function sync() {
      setLoadAds(
        ADSENSE_ENABLED && pathAllowed && hasAdvertisingConsent(),
      );
    }
    sync();
    window.addEventListener(CONSENT_CHANGED_EVENT, sync);
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, sync);
  }, [pathAllowed]);

  if (!loadAds) return null;

  return (
    <Script
      id="google-adsense"
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}

/** Call after consent to know if banner should stay hidden on first paint hint. */
export function readInitialAdConsent(): boolean {
  if (typeof window === "undefined") return false;
  return getStoredConsent() === "accepted";
}
