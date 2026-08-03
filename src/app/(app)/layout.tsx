import { headers } from "next/headers";
import { redirectIfOnboardingIncomplete } from "@/application/auth/require-onboarded";
import { getAdminSession } from "@/application/auth/require-admin";
import { AppShell } from "@/components/dashboard/app-shell";
import { canAccessAdmin } from "@/domain/user/entities";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerStore = await headers();
  const pathname = headerStore.get("x-pathname");
  const session = await redirectIfOnboardingIncomplete(pathname);

  if (!session) {
    return null;
  }

  const displayName =
    session.profile?.displayName ?? session.email.split("@")[0] ?? "Member";

  // Elevate PLATFORM_ADMIN_EMAILS to ADMIN when configured.
  const showAdmin = canAccessAdmin(session.user.role)
    ? true
    : Boolean(await getAdminSession());

  return (
    <AppShell
      displayName={displayName}
      username={session.profile?.username}
      avatarUrl={session.profile?.avatarUrl}
      email={session.email}
      showAdmin={showAdmin}
    >
      {children}
    </AppShell>
  );
}
