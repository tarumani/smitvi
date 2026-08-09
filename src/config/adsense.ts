/** Google AdSense publisher client (public). Leave empty to disable ads. */
export const ADSENSE_CLIENT =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() ||
  "ca-pub-2821950237713771";

export const ADSENSE_ENABLED = Boolean(ADSENSE_CLIENT);

/**
 * Only first-party editorial / policy pages may load Google-served ads.
 * Hub profiles, Twin chat, Discover, marketplace listings, examples, and other
 * UGC surfaces are excluded (AdSense “replicated content” policy).
 */
const ADSENSE_ALLOWED_EXACT = new Set([
  "/about",
  "/contact",
  "/how-it-helps",
  "/pricing",
  "/privacy",
  "/terms",
  "/disclaimer",
  "/developers",
  "/guides",
  "/product/train-your-twin",
  "/product/twin-chat",
  "/product/consultations",
  "/product/marketplace",
]);

const ADSENSE_ALLOWED_PREFIXES = ["/guides/"] as const;

/** Normalize pathname (no query/hash) and test AdSense allowlist. */
export function isAdSenseAllowedPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  const path = pathname.split("?")[0]?.split("#")[0] || "/";
  if (path !== "/" && path.endsWith("/")) {
    const trimmed = path.replace(/\/+$/, "") || "/";
    return isAdSenseAllowedPath(trimmed);
  }
  if (ADSENSE_ALLOWED_EXACT.has(path)) return true;
  return ADSENSE_ALLOWED_PREFIXES.some((prefix) => path.startsWith(prefix));
}
