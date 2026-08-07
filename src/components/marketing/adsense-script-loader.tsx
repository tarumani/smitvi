"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { ADSENSE_CLIENT, ADSENSE_ENABLED } from "@/config/adsense";
import {
  CONSENT_CHANGED_EVENT,
  getStoredConsent,
  hasAdvertisingConsent,
} from "@/lib/cookie-consent";

export function AdSenseScriptLoader() {
  const [loadAds, setLoadAds] = useState(false);

  useEffect(() => {
    function sync() {
      setLoadAds(ADSENSE_ENABLED && hasAdvertisingConsent());
    }
    sync();
    window.addEventListener(CONSENT_CHANGED_EVENT, sync);
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, sync);
  }, []);

  if (!loadAds) return null;

  return (
    <Script
      id="google-adsense"
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
      onLoad={() => {
        try {
          const w = window as Window & {
            adsbygoogle?: unknown[];
          };
          w.adsbygoogle = w.adsbygoogle || [];
          w.adsbygoogle.push({});
        } catch {
          /* ignore */
        }
      }}
    />
  );
}

/** Call after consent to know if banner should stay hidden on first paint hint. */
export function readInitialAdConsent(): boolean {
  if (typeof window === "undefined") return false;
  return getStoredConsent() === "accepted";
}
