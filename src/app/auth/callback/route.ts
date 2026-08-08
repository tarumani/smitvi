import { NextResponse } from "next/server";
import { resolveOnboardingRoute } from "@/application/onboarding/resolve-onboarding-route";
import { ROUTES } from "@/config/constants";
import { container } from "@/application/container";
import { createSupabaseServerClient } from "@/infrastructure/auth/supabase/server";
import { getClientIp } from "@/infrastructure/http/respond";
import { getRequestOrigin } from "@/infrastructure/http/request-origin";

function getSafeNextPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return ROUTES.hub.dashboard;
  }
  return value;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = getRequestOrigin(request);
  const code = url.searchParams.get("code");
  const next = getSafeNextPath(url.searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(
      new URL(`${ROUTES.login}?error=missing_code`, origin),
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user?.email) {
    return NextResponse.redirect(
      new URL(`${ROUTES.login}?error=auth_callback_failed`, origin),
    );
  }

  const isOAuth = (data.user.identities ?? []).some(
    (identity) => identity.provider !== "email",
  );
  const provider = data.user.app_metadata?.provider;
  const oauthTrusted =
    isOAuth || (typeof provider === "string" && provider !== "email");

  // Email/password must confirm; OAuth providers are already verified.
  if (!data.user.email_confirmed_at && !oauthTrusted) {
    await supabase.auth.signOut();
    return NextResponse.redirect(
      new URL(
        `${ROUTES.login}?next=${encodeURIComponent(next)}&verify=1`,
        origin,
      ),
    );
  }

  await container.syncAuthenticatedUser.execute(
    {
      id: data.user.id,
      email: data.user.email,
      emailVerified: true,
    },
    {
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent"),
    },
  );

  const profile = await container.profiles.findSummaryByUserId(data.user.id);
  const forceNext = next === ROUTES.resetPassword ? next : null;
  const destination = forceNext
    ? forceNext
    : profile?.isOnboarded
      ? next
      : resolveOnboardingRoute(profile);

  return NextResponse.redirect(new URL(destination, origin));
}
