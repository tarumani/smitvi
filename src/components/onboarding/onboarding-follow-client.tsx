"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { useOnboardingStepSubmit } from "@/components/onboarding/onboarding-step-actions";
import { cn } from "@/lib/utils";

type Expert = {
  username: string;
  displayName: string;
  headline: string | null;
  avatarUrl: string | null;
};

export function OnboardingFollowClient({ experts }: { experts: Expert[] }) {
  const [followed, setFollowed] = useState<Set<string>>(new Set());
  const { submit, isPending } = useOnboardingStepSubmit("follow");

  async function toggleFollow(username: string) {
    try {
      const isFollowing = followed.has(username);
      const response = await fetch(`/api/v1/profiles/${username}/follow`, {
        method: isFollowing ? "DELETE" : "POST",
      });
      if (!response.ok) throw new Error("Follow failed");
      setFollowed((prev) => {
        const next = new Set(prev);
        if (isFollowing) next.delete(username);
        else next.add(username);
        return next;
      });
    } catch {
      toast.error("Could not update follow");
    }
  }

  return (
    <OnboardingShell
      step="follow"
      title="Follow experts"
      subtitle="Follow at least 5 people to personalize Discover (or skip)."
      footer={
        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={() => submit({ skip: followed.size < 5 })}
            className="inline-flex w-full items-center justify-center rounded-xl bg-[var(--accent)] px-6 py-3.5 text-sm font-semibold text-[var(--accent-foreground)] disabled:opacity-60"
          >
            {isPending
              ? "Saving…"
              : followed.size >= 5
                ? "Continue"
                : "Skip for now"}
          </button>
        </div>
      }
    >
      {experts.length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)]">
          No public experts yet — skip and explore Discover later.
        </p>
      ) : (
        <ul className="max-h-[340px] space-y-2 overflow-y-auto pr-1">
          {experts.map((expert) => {
            const active = followed.has(expert.username);
            return (
              <li key={expert.username}>
                <button
                  type="button"
                  onClick={() => toggleFollow(expert.username)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
                    active
                      ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                      : "border-[var(--border)]",
                  )}
                >
                  <Avatar
                    src={expert.avatarUrl}
                    name={expert.displayName}
                    className="h-10 w-10"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {expert.displayName}
                    </p>
                    <p className="truncate text-xs text-[var(--muted-foreground)]">
                      @{expert.username}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-[var(--accent)]">
                    {active ? "Following" : "Follow"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-3 text-xs text-[var(--muted)]">
        {followed.size} selected · aim for 5+
      </p>
    </OnboardingShell>
  );
}
