import { redirect } from "next/navigation";
import { getCurrentSession } from "@/application/auth/get-current-session";
import { getAdminSession } from "@/application/auth/require-admin";
import { AppShell } from "@/components/dashboard/app-shell";
import { ROUTES } from "@/config/constants";
import { canAccessAdmin } from "@/domain/user/entities";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentSession();
  if (!session) {
    redirect(ROUTES.login);
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
