import { redirect } from "next/navigation";
import { getAdminSession } from "@/application/auth/require-admin";
import { AdminNav } from "@/components/admin/admin-nav";
import { ROUTES } from "@/config/constants";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();
  if (!session) {
    redirect(ROUTES.dashboard);
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold tracking-[0.14em] text-[var(--accent)] uppercase">
          Platform
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">
          Admin
        </h1>
        <p className="mt-2 text-[var(--muted-foreground)]">
          Manage users, twins, uploads, and moderation signals.
        </p>
      </div>
      <AdminNav />
      {children}
    </div>
  );
}
