"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  REFERRAL_QUERY_PARAM,
  writeReferralCookie,
} from "@/lib/referral";

/** Persists ?ref=username from the URL for attribution at profile creation. */
export function CaptureReferralFromUrl() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get(REFERRAL_QUERY_PARAM);
    if (ref) writeReferralCookie(ref);
  }, [searchParams]);

  return null;
}
