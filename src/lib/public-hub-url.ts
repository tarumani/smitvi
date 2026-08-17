import { PRODUCTION_APP_URL, ROUTES } from "@/config/constants";

export function appOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || PRODUCTION_APP_URL
  );
}

export function publicHubUrl(username: string): string {
  return `${appOrigin()}${ROUTES.publicProfile(username)}`;
}

/**
 * Map pretty `/@username` URLs onto the real `/u/[username]` route.
 * Next.js treats `@…` as a parallel-route slot, so this must run before files.
 * Also accepts `%40username` (encoded @) from first-click / messenger links.
 */
export function publicHubRewritePath(pathname: string): string | null {
  let path = pathname;
  try {
    path = decodeURIComponent(pathname);
  } catch {
    /* keep original */
  }
  if (!path.startsWith("/@")) return null;
  const rest = path.slice(2);
  if (!rest) return null;
  return `/u/${rest}`;
}

export function publicTwinChatUrl(username: string): string {
  return `${appOrigin()}${ROUTES.publicTwinChat(username)}`;
}

/** Absolute URL for Open Graph when avatar is stored as a path. */
export function absoluteMediaUrl(url: string | null | undefined): string | undefined {
  if (!url?.trim()) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const base = appOrigin();
  return url.startsWith("/") ? `${base}${url}` : `${base}/${url}`;
}

export function hubShareMessage(input: {
  displayName: string;
  username: string;
  twinReady: boolean;
}): string {
  const link = publicHubUrl(input.username);
  if (input.twinReady) {
    return `Chat with ${input.displayName}'s AI Twin on Smitvi — trained on their real expertise.\n${link}`;
  }
  return `Explore ${input.displayName}'s Intelligence Hub on Smitvi.\n${link}`;
}
