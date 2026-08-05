import { redirect } from "next/navigation";
import {
  getCurrentSession,
  requireSession,
  type CurrentSession,
} from "@/application/auth/get-current-session";
import { ROUTES } from "@/config/constants";

export function hasCompletedUsernameSetup(
  session: CurrentSession | null | undefined,
): boolean {
  return Boolean(
    session?.profile?.isOnboarded && session.profile.username?.trim(),
  );
}

/** Require a claimed @username (onboarding complete). */
export async function requireOnboardedSession(): Promise<CurrentSession> {
  const session = await requireSession();
  if (!hasCompletedUsernameSetup(session)) {
    redirect(ROUTES.onboarding);
  }
  return session;
}

export async function redirectIfOnboardingIncomplete(
  pathname: string | null,
): Promise<CurrentSession | null> {
  const session = await getCurrentSession();
  if (!session) {
    redirect(ROUTES.login);
  }

  const onOnboarding =
    pathname === ROUTES.onboarding ||
    Boolean(pathname?.startsWith(`${ROUTES.onboarding}/`));

  if (!hasCompletedUsernameSetup(session) && !onOnboarding) {
    redirect(ROUTES.onboarding);
  }

  if (hasCompletedUsernameSetup(session) && onOnboarding) {
    redirect(ROUTES.hub.dashboard);
  }

  return session;
}
