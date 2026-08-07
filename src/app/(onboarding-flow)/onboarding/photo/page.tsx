"use client";

import { useState } from "react";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { useOnboardingStepSubmit } from "@/components/onboarding/onboarding-step-actions";
import { ProfileAvatarUpload } from "@/components/profile/profile-avatar-upload";

export default function OnboardingPhotoPage() {
  const [avatarUrl, setAvatarUrl] = useState("");
  const { submit, isPending } = useOnboardingStepSubmit("photo");

  return (
    <OnboardingShell
      step="photo"
      title="Add a profile photo"
      subtitle="Profiles with photos get more trust and Twin chats."
      footer={
        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              submit(avatarUrl.trim() ? { avatarUrl: avatarUrl.trim() } : {})
            }
            className="inline-flex w-full items-center justify-center rounded-xl bg-[var(--accent)] px-6 py-3.5 text-sm font-semibold text-[var(--accent-foreground)] disabled:opacity-60"
          >
            {isPending ? "Saving…" : avatarUrl.trim() ? "Continue" : "Skip for now"}
          </button>
        </div>
      }
    >
      <ProfileAvatarUpload
        displayName="You"
        avatarUrl={avatarUrl || null}
        onUploaded={setAvatarUrl}
      />
    </OnboardingShell>
  );
}
