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

export type ExpertInviteTemplateId = "professional" | "creator" | "short";

export function expertInviteTemplate(
  templateId: ExpertInviteTemplateId,
  displayName: string,
  link: string,
): string {
  switch (templateId) {
    case "short":
      return `I'm on Smitvi with an AI Twin for my expertise. Join me: ${link}`;
    case "creator":
      return `Hey — ${displayName} here. I'm training an AI Twin on Smitvi so my knowledge scales (chat, marketplace, consults). If your knowledge is your product too, claim your @username: ${link}`;
    case "professional":
    default:
      return `Hi,\n\nI'm building my Intelligence Hub on Smitvi — an AI Twin trained on my work, with a public profile and marketplace.\n\nI'd like you on the network: create your hub (free) and we can cross-discover on Discover.\n\n${link}\n\n— ${displayName}`;
  }
}

export function whatsAppShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function mailtoInviteUrl(subject: string, body: string): string {
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** Client-side cookie setter (call from signup landing). */
export function writeReferralCookie(username: string): void {
  const ref = normalizeReferrerUsername(username);
  if (!ref || typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${REFERRAL_COOKIE_NAME}=${encodeURIComponent(ref)}; Path=/; Max-Age=${REFERRAL_COOKIE_MAX_AGE_SEC}; SameSite=Lax${secure}`;
}
