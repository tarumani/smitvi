import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { GlassCard } from "@/components/ui/glass-card";
import { ProfileForm } from "@/components/profile/profile-form";
import { ROUTES } from "@/config/constants";

export const metadata: Metadata = {
  title: "Profile settings",
};

export default async function ProfileSettingsPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect(ROUTES.login);
  }

  if (!session.profile?.isOnboarded) {
    redirect(ROUTES.onboarding);
  }

  const profile = await container.getMyProfile.execute(session.user.id);
  if (!profile) {
    redirect(ROUTES.onboarding);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Profile
        </h1>
        <p className="mt-2 text-[var(--muted-foreground)]">
          Control how you appear on your public Knowledge Twin surface.
        </p>
      </div>
      <GlassCard className="p-6 sm:p-8">
        <ProfileForm mode="edit" initialProfile={profile} />
      </GlassCard>
    </div>
  );
}
