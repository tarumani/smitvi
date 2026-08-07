/** Google AdSense publisher client (public). Leave empty to disable ads. */
export const ADSENSE_CLIENT =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() ||
  "ca-pub-2821950237713771";

export const ADSENSE_ENABLED = Boolean(ADSENSE_CLIENT);
