import { PRODUCTION_APP_URL, ROUTES } from "@/config/constants";

/** Email confirm / resend — whitelist this exact URL in Supabase (no query string). */
export function buildAuthCallbackRedirectTo(appOrigin: string): string {
  const origin = appOrigin.replace(/\/$/, "") || PRODUCTION_APP_URL;
  return `${origin}${ROUTES.authCallback}`;
}
