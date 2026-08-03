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
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = ROUTES.login;
    loginUrl.searchParams.set("next", pathname + request.nextUrl.search);
    return applySessionCookies(NextResponse.redirect(loginUrl), sessionCookies);
  }

  if (isAuthRoute && user) {
    const next = safeNextPath(request.nextUrl.searchParams.get("next"));
    const dest = request.nextUrl.clone();
    if (next) {
      const target = new URL(next, request.nextUrl.origin);
      dest.pathname = target.pathname;
      dest.search = target.search;
    } else {
      dest.pathname = ROUTES.dashboard;
      dest.search = "";
    }
    return applySessionCookies(NextResponse.redirect(dest), sessionCookies);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
