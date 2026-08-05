import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { GlassCard } from "@/components/ui/glass-card";
import { ProfileForm } from "@/components/profile/profile-form";
import { ROUTES } from "@/config/constants";

export const metadata: Metadata = {
  title: "Your profile",
};

export default async function OnboardingProfilePage() {
  const session = await getCurrentSession();
  if (!session) redirect(ROUTES.login);

  const profile = await container.getMyProfile.execute(session.user.id);
  if (!profile?.hubArchetypeId) {
    redirect(ROUTES.onboardingArchetype);
  }

  const defaultDisplayName = session.email.split("@")[0] ?? "";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Claim your @username
        </h1>
        <p className="mt-2 text-[var(--muted-foreground)]">
          This is your public Intelligence Hub storefront.
        </p>
      </div>
      <GlassCard className="p-6 sm:p-8">
        <ProfileForm
          mode={profile ? "edit" : "create"}
          initialProfile={profile}
          defaultDisplayName={defaultDisplayName}
          defaultUsername={defaultDisplayName}
          onboardingMode
        />
      </GlassCard>
    </div>
  );
}
