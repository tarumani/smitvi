import { type NextRequest, NextResponse } from "next/server";
import {
  AUTH_PATH_PREFIXES,
  PROTECTED_PATH_PREFIXES,
  ROUTES,
} from "@/config/constants";
import {
  applySessionCookies,
  updateSession,
} from "@/infrastructure/auth/supabase/proxy-client";
import { getRequestOrigin } from "@/infrastructure/http/request-origin";

function matchesPrefix(pathname: string, prefixes: readonly string[]) {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** Same-origin relative paths only (blocks open redirects). */
function safeNextPath(next: string | null): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

function absoluteUrl(request: NextRequest, pathWithSearch: string) {
  return new URL(pathWithSearch, getRequestOrigin(request));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { response, user, sessionCookies } = await updateSession(request);

  // smitvi.com/@username → /u/username (and /@username/chat → /u/username/chat)
  if (pathname.startsWith("/@")) {
    const rest = pathname.slice(2);
    if (rest.length > 0) {
      const url = request.nextUrl.clone();
      url.pathname = `/u/${rest}`;
      return applySessionCookies(NextResponse.rewrite(url), sessionCookies);
    }
  }

  const isProtected = matchesPrefix(pathname, PROTECTED_PATH_PREFIXES);
  const isAuthRoute = matchesPrefix(pathname, AUTH_PATH_PREFIXES);

  if (isProtected && !user) {
    const next = pathname + request.nextUrl.search;
    const loginUrl = absoluteUrl(
      request,
      `${ROUTES.login}?next=${encodeURIComponent(next)}`,
    );
    return applySessionCookies(NextResponse.redirect(loginUrl), sessionCookies);
  }

  if (isAuthRoute && user) {
    const next = safeNextPath(request.nextUrl.searchParams.get("next"));
    const dest = absoluteUrl(request, next ?? ROUTES.dashboard);
    return applySessionCookies(NextResponse.redirect(dest), sessionCookies);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
