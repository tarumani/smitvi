import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { ProfileForm } from "@/components/profile/profile-form";
import { ProjectsEditor } from "@/components/profile/projects-editor";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
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
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Profile
          </h1>
          <p className="mt-2 text-[var(--muted-foreground)]">
            Control how you appear on your public Knowledge Twin surface,
            including projects.
          </p>
        </div>
        <Button asChild variant="secondary">
          <Link href={ROUTES.publicProfile(profile.username)}>
            View public profile
          </Link>
        </Button>
      </div>
      <GlassCard className="p-6 sm:p-8">
        <ProfileForm mode="edit" initialProfile={profile} />
      </GlassCard>
      <GlassCard className="p-6 sm:p-8">
        <ProjectsEditor initialProjects={profile.portfolio} />
      </GlassCard>
    </div>
  );
}
