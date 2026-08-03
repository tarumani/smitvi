import { NextResponse } from "next/server";
import { ROUTES } from "@/config/constants";
import { container } from "@/application/container";
import { createSupabaseServerClient } from "@/infrastructure/auth/supabase/server";
import { getClientIp } from "@/infrastructure/http/respond";

function getSafeNextPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return ROUTES.dashboard;
  }
  return value;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = getSafeNextPath(url.searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(new URL(`${ROUTES.login}?error=missing_code`, url.origin));
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user?.email) {
    return NextResponse.redirect(
      new URL(`${ROUTES.login}?error=auth_callback_failed`, url.origin),
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
        url.origin,
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
  const destination = profile?.isOnboarded ? next : ROUTES.onboarding;

  return NextResponse.redirect(new URL(destination, url.origin));
}
