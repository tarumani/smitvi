"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ROUTES } from "@/config/constants";
import type { ProfileEntity } from "@/domain/profile/entities";
import { Avatar } from "@/components/ui/avatar";

type ProfileFormProps = {
  mode: "create" | "edit";
  initialProfile?: ProfileEntity | null;
  defaultDisplayName?: string;
  defaultUsername?: string;
  /** Multi-step onboarding — routes to connect after save. */
  onboardingMode?: boolean;
};

function suggestUsername(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "")
    .replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, "")
    .slice(0, 30);
}

type FormState = {
  username: string;
  displayName: string;
  headline: string;
  bio: string;
  websiteUrl: string;
  location: string;
  skills: string;
  avatarUrl: string;
  publicTwinEnabled: boolean;
};

export function ProfileForm({
  mode,
  initialProfile,
  defaultDisplayName = "",
  defaultUsername = "",
  onboardingMode = false,
}: ProfileFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<FormState>({
    username:
      initialProfile?.username ??
      suggestUsername(defaultUsername || defaultDisplayName),
    displayName: initialProfile?.displayName ?? defaultDisplayName,
    headline: initialProfile?.headline ?? "",
    bio: initialProfile?.bio ?? "",
    websiteUrl: initialProfile?.websiteUrl ?? "",
    location: initialProfile?.location ?? "",
    skills: initialProfile?.skills.map((skill) => skill.name).join(", ") ?? "",
    avatarUrl: initialProfile?.avatarUrl ?? "",
    publicTwinEnabled: initialProfile?.publicTwinEnabled ?? true,
  });

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      try {
        const username = form.username.trim().toLowerCase();
        if (!username) {
          throw new Error("Username is required");
        }

        const payload = {
          username,
          displayName: form.displayName,
          headline: form.headline || null,
          bio: form.bio || null,
          websiteUrl: form.websiteUrl || null,
          location: form.location || null,
          avatarUrl: form.avatarUrl.trim() || null,
          skills: form.skills
            .split(",")
            .map((skill) => skill.trim())
            .filter(Boolean),
          visibility: "PUBLIC" as const,
          publicTwinEnabled: form.publicTwinEnabled,
          ...(onboardingMode
            ? { onboardingStep: "connect" as const }
            : {}),
        };

        const response = await fetch("/api/v1/profiles/me", {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const json: unknown = await response.json();
        if (!response.ok) {
          const message =
            typeof json === "object" &&
            json !== null &&
            "error" in json &&
            typeof (json as { error?: { message?: string } }).error?.message ===
              "string"
              ? (json as { error: { message: string } }).error.message
              : "Failed to save profile";
          throw new Error(message);
        }

        toast.success(mode === "create" ? "Profile created" : "Profile updated");
        if (onboardingMode) {
          router.replace(ROUTES.onboardingConnect);
        } else {
          router.replace(ROUTES.hub.dashboard);
        }
        router.refresh();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to save profile";
        toast.error(message);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <Avatar
          src={form.avatarUrl.trim() || null}
          name={form.displayName || "You"}
          className="h-20 w-20 shrink-0"
        />
        <div className="min-w-0 flex-1 space-y-2">
          <Label htmlFor="avatarUrl">Profile photo URL</Label>
          <Input
            id="avatarUrl"
            type="url"
            value={form.avatarUrl}
            onChange={(event) => updateField("avatarUrl", event.target.value)}
            placeholder="https://… (public image link)"
          />
          <p className="text-xs text-[var(--muted)]">
            Paste a direct link to your photo (HTTPS). Saves +10 on your Human
            Intelligence Score when set.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[var(--muted)]">
              @
            </span>
            <Input
              id="username"
              className="pl-8"
              required
              minLength={3}
              maxLength={30}
              value={form.username}
              onChange={(event) =>
                updateField("username", suggestUsername(event.target.value))
              }
              placeholder="yourname"
            />
          </div>
          <p className="text-xs text-[var(--muted)]">
            Required. Your public page will be smitvi.com/@username
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="displayName">Display name</Label>
          <Input
            id="displayName"
            required
            value={form.displayName}
            onChange={(event) => updateField("displayName", event.target.value)}
            placeholder="Ada Lovelace"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="headline">Headline</Label>
        <Input
          id="headline"
          value={form.headline}
          onChange={(event) => updateField("headline", event.target.value)}
          placeholder="AI systems architect · Knowledge engineer"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          value={form.bio}
          onChange={(event) => updateField("bio", event.target.value)}
          placeholder="What expertise should your Knowledge Twin represent?"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="websiteUrl">Website</Label>
          <Input
            id="websiteUrl"
            type="url"
            value={form.websiteUrl}
            onChange={(event) => updateField("websiteUrl", event.target.value)}
            placeholder="https://"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={form.location}
            onChange={(event) => updateField("location", event.target.value)}
            placeholder="Remote · London · NYC"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="skills">Skills</Label>
        <Input
          id="skills"
          value={form.skills}
          onChange={(event) => updateField("skills", event.target.value)}
          placeholder="TypeScript, Product Strategy, Machine Learning"
        />
        <p className="text-xs text-[var(--muted)]">Comma-separated</p>
      </div>

      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={form.publicTwinEnabled}
          onChange={(event) =>
            updateField("publicTwinEnabled", event.target.checked)
          }
          className="h-4 w-4 rounded border-[var(--border)]"
        />
        Enable public Twin chat on my profile
      </label>

      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        {isPending
          ? "Saving…"
          : mode === "create"
            ? "Create profile"
            : "Save changes"}
      </Button>
    </form>
  );
}
