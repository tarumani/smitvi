import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/application/auth/get-current-session";
import { ChangePasswordForm } from "@/components/settings/change-password-form";
import { GlassCard } from "@/components/ui/glass-card";
import { ROUTES } from "@/config/constants";

export const metadata: Metadata = {
  title: "Change password",
};

export default async function PasswordSettingsPage() {
  const session = await getCurrentSession();
  if (!session) redirect(ROUTES.login);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <div>
        <p className="text-sm font-semibold tracking-[0.16em] text-[var(--accent)] uppercase">
          Account
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">
          Change password
        </h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Update the password for {session.email}.
        </p>
      </div>
      <GlassCard className="p-6 sm:p-8">
        <ChangePasswordForm />
      </GlassCard>
    </div>
  );
}
