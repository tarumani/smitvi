import { NextResponse } from "next/server";
import { ROUTES } from "@/config/constants";
import { container } from "@/application/container";
import { createSupabaseServerClient } from "@/infrastructure/auth/supabase/server";
import { getClientIp } from "@/infrastructure/http/respond";
import { getRequestOrigin } from "@/infrastructure/http/request-origin";

/** Password-reset emails redirect here (whitelist this exact path in Supabase). */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = getRequestOrigin(request);
  const code = url.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      new URL(`${ROUTES.forgotPassword}?error=missing_code`, origin),
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user?.email) {
    return NextResponse.redirect(
      new URL(`${ROUTES.forgotPassword}?error=auth_callback_failed`, origin),
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

  return NextResponse.redirect(new URL(ROUTES.resetPassword, origin));
}
