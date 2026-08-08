import { PRODUCTION_APP_URL, ROUTES } from "@/config/constants";

/** Redirect URL passed to Supabase recover — must be listed in Auth → URL configuration. */
export function buildPasswordResetRedirectTo(appOrigin: string): string {
  const origin = appOrigin.replace(/\/$/, "") || PRODUCTION_APP_URL;
  return `${origin}${ROUTES.authRecoveryCallback}`;
}
