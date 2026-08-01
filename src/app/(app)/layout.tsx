import { redirect } from "next/navigation";
import { getCurrentSession } from "@/application/auth/get-current-session";
import { AppShell } from "@/components/dashboard/app-shell";
import { ROUTES } from "@/config/constants";

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

  return (
    <AppShell
      displayName={displayName}
      username={session.profile?.username}
      avatarUrl={session.profile?.avatarUrl}
      email={session.email}
    >
      {children}
    </AppShell>
  );
}
