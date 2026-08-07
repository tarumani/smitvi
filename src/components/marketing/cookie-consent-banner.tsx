"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/constants";
import { ADSENSE_ENABLED } from "@/config/adsense";
import {
  getStoredConsent,
  setStoredConsent,
  type CookieConsentChoice,
} from "@/lib/cookie-consent";

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!getStoredConsent()) {
      setVisible(true);
    }
    function onOpen() {
      setVisible(true);
    }
    window.addEventListener("smitvi-open-cookie-banner", onOpen);
    return () => window.removeEventListener("smitvi-open-cookie-banner", onOpen);
  }, []);

  function choose(choice: CookieConsentChoice) {
    setStoredConsent(choice);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      className="fixed inset-x-0 bottom-0 z-[100] border-t border-[var(--border)] bg-[var(--surface)]/95 p-4 shadow-[0_-12px_40px_rgba(15,23,42,0.12)] backdrop-blur-md sm:p-5"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl text-sm leading-relaxed text-[var(--muted-foreground)]">
          <p className="font-semibold text-[var(--foreground)]">Cookies on Smitvi</p>
          <p className="mt-1">
            We use essential cookies for sign-in and theme.{" "}
            {ADSENSE_ENABLED ? (
              <>
                With your consent, Google AdSense may use cookies to show ads and
                measure traffic. See our{" "}
                <Link href={ROUTES.privacy} className="text-[var(--accent)] hover:underline">
                  Privacy Policy
                </Link>
                .
              </>
            ) : (
              <>
                See our{" "}
                <Link href={ROUTES.privacy} className="text-[var(--accent)] hover:underline">
                  Privacy Policy
                </Link>
                .
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:shrink-0">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => choose("essential")}
          >
            Essential only
          </Button>
          {ADSENSE_ENABLED ? (
            <Button type="button" size="sm" onClick={() => choose("accepted")}>
              Accept all
            </Button>
          ) : (
            <Button type="button" size="sm" onClick={() => choose("essential")}>
              OK
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
