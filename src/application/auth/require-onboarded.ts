import { redirect } from "next/navigation";
import {
  getCurrentSession,
  requireSession,
  type CurrentSession,
} from "@/application/auth/get-current-session";
import { resolveOnboardingRoute } from "@/application/onboarding/resolve-onboarding-route";
import { ROUTES } from "@/config/constants";

export function hasCompletedUsernameSetup(
  session: CurrentSession | null | undefined,
): boolean {
  return Boolean(session?.profile?.isOnboarded);
}

/** Require full onboarding (celebrate complete). */
export async function requireOnboardedSession(): Promise<CurrentSession> {
  const session = await requireSession();
  if (!hasCompletedUsernameSetup(session)) {
    redirect(resolveOnboardingRoute(session.profile));
  }
  return session;
}

function isOnboardingPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return (
    pathname === ROUTES.onboarding ||
    pathname.startsWith(`${ROUTES.onboarding}/`)
  );
}

/** Profile editing is allowed before the activation funnel is complete. */
function isProfileSettingsPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return (
    pathname === ROUTES.profileSettings ||
    pathname === ROUTES.hub.settings
  );
}

export async function redirectIfOnboardingIncomplete(
  pathname: string | null,
): Promise<CurrentSession | null> {
  const session = await getCurrentSession();
  if (!session) {
    redirect(ROUTES.login);
  }

  const onOnboarding = isOnboardingPath(pathname);

  const onProfileSettings = isProfileSettingsPath(pathname);

  if (
    !hasCompletedUsernameSetup(session) &&
    !onOnboarding &&
    !onProfileSettings
  ) {
    redirect(resolveOnboardingRoute(session.profile));
  }

  if (hasCompletedUsernameSetup(session) && onOnboarding) {
    redirect(ROUTES.hub.dashboard);
  }

  return session;
}
