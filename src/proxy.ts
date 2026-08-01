import { type NextRequest, NextResponse } from "next/server";
import {
  AUTH_PATH_PREFIXES,
  PROTECTED_PATH_PREFIXES,
  ROUTES,
} from "@/config/constants";
import { updateSession } from "@/infrastructure/auth/supabase/proxy-client";

function matchesPrefix(pathname: string, prefixes: readonly string[]) {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // smitvi.com/@username → /u/username (and /@username/chat → /u/username/chat)
  if (pathname.startsWith("/@")) {
    const rest = pathname.slice(2);
    if (rest.length > 0) {
      const url = request.nextUrl.clone();
      url.pathname = `/u/${rest}`;
      return NextResponse.rewrite(url);
    }
  }

  const { response, user } = await updateSession(request);

  const isProtected = matchesPrefix(pathname, PROTECTED_PATH_PREFIXES);
  const isAuthRoute = matchesPrefix(pathname, AUTH_PATH_PREFIXES);

  if (isProtected && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = ROUTES.login;
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && user) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = ROUTES.dashboard;
    dashboardUrl.search = "";
    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
