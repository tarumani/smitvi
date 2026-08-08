import { PRODUCTION_APP_URL, ROUTES } from "@/config/constants";
import { getRequestOrigin } from "@/infrastructure/http/request-origin";

/** Email confirm / resend — whitelist this exact URL in Supabase (no query string). */
export function buildAuthCallbackRedirectTo(appOrigin: string): string {
  const origin = appOrigin.replace(/\/$/, "") || PRODUCTION_APP_URL;
  return `${origin}${ROUTES.authCallback}`;
}

/** Never use internal Fly hostnames in Supabase email redirect_to. */
export function resolveAuthEmailOrigin(request: Request): string {
  if (process.env.NODE_ENV === "production") {
    const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
    return configured && !configured.includes("localhost")
      ? configured
      : PRODUCTION_APP_URL;
  }
  return getRequestOrigin(request);
}
