import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChangePasswordForm } from "@/components/settings/change-password-form";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { getCurrentSession } from "@/application/auth/get-current-session";
import { ROUTES } from "@/config/constants";

export const metadata: Metadata = {
  title: "Set new password",
};

export default async function ResetPasswordPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect(`${ROUTES.forgotPassword}?error=session`);
  }

  return (
    <GlassCard className="w-full max-w-md px-5 py-5 sm:px-6 sm:py-6">
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-[1.75rem]">
          Choose a new password
        </h1>
        <p className="mt-1.5 text-sm text-[var(--muted-foreground)]">
          Signed in as {session.email}. Enter a new password below.
        </p>
      </div>
      <div className="mt-6">
        <ChangePasswordForm />
      </div>
      <div className="mt-4 text-center">
        <Button asChild variant="secondary" className="w-full">
          <Link href={ROUTES.hub.dashboard}>Continue to dashboard</Link>
        </Button>
      </div>
    </GlassCard>
  );
}
