"use client";

import { useEffect, useState } from "react";
import { ADSENSE_CLIENT, ADSENSE_ENABLED } from "@/config/adsense";
import {
  CONSENT_CHANGED_EVENT,
  hasAdvertisingConsent,
} from "@/lib/cookie-consent";

declare global {
  interface Window {
    adsbygoogle?: Record<string, unknown>[];
  }
}

/** Optional display ad on public marketing pages (after cookie consent). */
export function MarketingPageFooterAd() {
  const [show, setShow] = useState(false);
  const slot = process.env.NEXT_PUBLIC_ADSENSE_DISPLAY_SLOT?.trim();

  useEffect(() => {
    function sync() {
      setShow(ADSENSE_ENABLED && hasAdvertisingConsent() && Boolean(slot));
    }
    sync();
    window.addEventListener(CONSENT_CHANGED_EVENT, sync);
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, sync);
  }, [slot]);

  useEffect(() => {
    if (!show) return;
    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
    } catch {
      /* ignore */
    }
  }, [show]);

  if (!show || !slot) return null;

  return (
    <div className="border-t border-[var(--border)] bg-[var(--surface)]/30 py-6">
      <div className="mx-auto flex w-full max-w-6xl justify-center px-4 sm:px-6">
        <ins
          className="adsbygoogle block min-h-[90px] w-full max-w-3xl"
          style={{ display: "block" }}
          data-ad-client={ADSENSE_CLIENT}
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
}
