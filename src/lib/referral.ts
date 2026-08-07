import { ROUTES, USERNAME_MAX, USERNAME_MIN } from "@/config/constants";
import { appOrigin } from "@/lib/public-hub-url";

export const REFERRAL_QUERY_PARAM = "ref";
export const REFERRAL_COOKIE_NAME = "smitvi_referrer";
export const REFERRAL_COOKIE_MAX_AGE_SEC = 30 * 24 * 60 * 60;

const usernameRegex = /^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/;

export function normalizeReferrerUsername(
  raw: string | null | undefined,
): string | null {
  if (!raw?.trim()) return null;
  const value = raw.trim().toLowerCase();
  if (value.length < USERNAME_MIN || value.length > USERNAME_MAX) return null;
  if (!usernameRegex.test(value)) return null;
  return value;
}

export function referralSignupPath(referrerUsername: string): string {
  const ref = normalizeReferrerUsername(referrerUsername);
  if (!ref) return ROUTES.signup;
  return `${ROUTES.signup}?${REFERRAL_QUERY_PARAM}=${encodeURIComponent(ref)}`;
}

export function referralSignupUrl(referrerUsername: string): string {
  return `${appOrigin()}${referralSignupPath(referrerUsername)}`;
}

export function referralInviteMessage(
  referrerDisplayName: string,
  link: string,
): string {
  return `${referrerDisplayName} invited you to Smitvi — train your AI Twin and sell what you know.\n${link}`;
}

/** Client-side cookie setter (call from signup landing). */
export function writeReferralCookie(username: string): void {
  const ref = normalizeReferrerUsername(username);
  if (!ref || typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${REFERRAL_COOKIE_NAME}=${encodeURIComponent(ref)}; Path=/; Max-Age=${REFERRAL_COOKIE_MAX_AGE_SEC}; SameSite=Lax${secure}`;
}
