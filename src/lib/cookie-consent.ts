export const CONSENT_STORAGE_KEY = "smitvi-cookie-consent";
export const CONSENT_CHANGED_EVENT = "smitvi-consent-changed";

export type CookieConsentChoice = "accepted" | "essential";

export function getStoredConsent(): CookieConsentChoice | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(CONSENT_STORAGE_KEY);
  if (value === "accepted" || value === "essential") return value;
  return null;
}

export function setStoredConsent(choice: CookieConsentChoice): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CONSENT_STORAGE_KEY, choice);
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT, { detail: choice }));
}

export function hasAdvertisingConsent(): boolean {
  return getStoredConsent() === "accepted";
}

export function openCookiePreferences(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("smitvi-open-cookie-banner"));
}
