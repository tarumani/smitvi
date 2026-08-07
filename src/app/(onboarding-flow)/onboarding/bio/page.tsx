"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { useOnboardingStepSubmit } from "@/components/onboarding/onboarding-step-actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { loadOnboardingDraft } from "@/components/onboarding/use-onboarding-draft";

const BIO_TEMPLATES = [
  "I help teams design modern digital products.",
  "I build scalable web applications and developer tools.",
  "I teach and share practical knowledge in my field.",
];

export default function OnboardingBioPage() {
  const { submit, isPending } = useOnboardingStepSubmit("bio");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [hint, setHint] = useState("");
  const [suggesting, setSuggesting] = useState(false);

  useEffect(() => {
    const draft = loadOnboardingDraft();
    if (draft?.bioHint) setHint(draft.bioHint);
  }, []);

  async function regenerateBio() {
    setSuggesting(true);
    try {
      const response = await fetch("/api/v1/onboarding/suggest-bio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hint: hint || bio }),
      });
      const json: unknown = await response.json();
      if (!response.ok) throw new Error("Could not generate");
      const text =
        typeof json === "object" &&
        json !== null &&
        "data" in json &&
        typeof (json as { data?: { bio?: string } }).data?.bio === "string"
          ? (json as { data: { bio: string } }).data.bio
          : BIO_TEMPLATES[Math.floor(Math.random() * BIO_TEMPLATES.length)];
      setBio(text);
      if (!headline) setHeadline(text.slice(0, 120));
    } catch {
      setBio(BIO_TEMPLATES[Math.floor(Math.random() * BIO_TEMPLATES.length)]!);
    } finally {
      setSuggesting(false);
    }
  }

  return (
    <OnboardingShell
      step="bio"
      title="What are you good at?"
      subtitle="Your bio powers your public hub and AI Twin voice."
      footer={
        <button
          type="button"
          disabled={isPending || username.length < 3 || !displayName.trim()}
          onClick={() =>
            submit({ username, displayName, headline, bio, hint })
          }
          className="inline-flex w-full items-center justify-center rounded-xl bg-[var(--accent)] px-6 py-3.5 text-sm font-semibold text-[var(--accent-foreground)] disabled:opacity-50"
        >
          {isPending ? "Opening dashboard…" : "Go to dashboard"}
        </button>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="username">@username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              placeholder="yourname"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="displayName">Display name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="hint">Quick hint for AI</Label>
          <Input
            id="hint"
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            placeholder="e.g. UI/UX for startups"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="bio">Bio</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={suggesting}
              onClick={regenerateBio}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {suggesting ? "Generating…" : "AI suggest"}
            </Button>
          </div>
          <Textarea
            id="bio"
            className="min-h-[100px]"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Describe yourself in a few sentences…"
          />
        </div>
      </div>
    </OnboardingShell>
  );
}
