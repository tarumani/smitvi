"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { ROUTES } from "@/config/constants";
import {
  PROFILE_TYPES,
  PROFILE_TYPE_COPY,
  type ProfileTypeId,
} from "@/domain/profile/activation";
import type { ProfileAiDraft, ReviewableField } from "@/domain/profile/profile-extraction";
import type { MissingQuestion } from "@/domain/profile/missing-questions";
import { DISCOVERY_INTENT_OPTIONS } from "@/domain/profile/missing-questions";
import type { IntelligenceReadinessResult } from "@/domain/profile/intelligence-readiness";

type Step =
  | "welcome"
  | "type"
  | "tell"
  | "analyzing"
  | "review"
  | "questions"
  | "ready"
  | "activated";

type Props = { mode?: "onboarding" | "improve" };

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const json: unknown = await response.json();
  if (!response.ok) {
    const message =
      typeof json === "object" &&
      json !== null &&
      "error" in json &&
      typeof (json as { error?: { message?: string } }).error?.message === "string"
        ? (json as { error: { message: string } }).error.message
        : "Something went wrong";
    throw new Error(message);
  }
  return (json as { data: T }).data;
}

function Chip({
  label,
  onRemove,
}: {
  label: string;
  onRemove?: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-sm">
      {label}
      {onRemove ? (
        <button type="button" className="text-[var(--muted)]" onClick={onRemove}>
          ×
        </button>
      ) : null}
    </span>
  );
}

function EditableList({
  title,
  items,
  onChange,
}: {
  title: string;
  items: ReviewableField<string>[];
  onChange: (next: ReviewableField<string>[]) => void;
}) {
  const [adding, setAdding] = useState("");
  const visible = items.filter((i) => i.status !== "REJECTED");
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <button
          type="button"
          className="text-xs text-[var(--accent)]"
          onClick={() => {
            const value = window.prompt(`Add ${title.toLowerCase()}`);
            if (value?.trim()) {
              onChange([
                ...items,
                {
                  value: value.trim(),
                  source: "USER",
                  status: "EDITED",
                },
              ]);
            }
          }}
        >
          Add
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {visible.map((item, index) => (
          <Chip
            key={`${item.value}-${index}`}
            label={item.value}
            onRemove={() =>
              onChange(
                items.map((row, i) =>
                  i === items.indexOf(item)
                    ? { ...row, status: "REJECTED" }
                    : row,
                ),
              )
            }
          />
        ))}
        {visible.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">None yet</p>
        ) : null}
      </div>
      {adding ? (
        <input value={adding} onChange={(e) => setAdding(e.target.value)} />
      ) : null}
    </div>
  );
}

export function IntelligenceOnboardingWizard({ mode = "onboarding" }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(mode === "improve" ? "tell" : "welcome");
  const [profileType, setProfileType] = useState<ProfileTypeId>("PROFESSIONAL");
  const [narrative, setNarrative] = useState("");
  const [linkedInUrl, setLinkedInUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [draft, setDraft] = useState<ProfileAiDraft | null>(null);
  const [qualityMessage, setQualityMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [typeSuggestion, setTypeSuggestion] = useState<string | null>(null);
  const [questions, setQuestions] = useState<MissingQuestion[]>([]);
  const [intents, setIntents] = useState<string[]>([]);
  const [proudProject, setProudProject] = useState("");
  const [helpTopics, setHelpTopics] = useState("");
  const [readiness, setReadiness] = useState<IntelligenceReadinessResult | null>(
    null,
  );
  const [activated, setActivated] = useState(false);

  const progress = useMemo(() => {
    const order: Step[] = [
      "welcome",
      "type",
      "tell",
      "analyzing",
      "review",
      "questions",
      "ready",
      "activated",
    ];
    return Math.round((order.indexOf(step) / (order.length - 1)) * 100);
  }, [step]);

  useEffect(() => {
    void api<{
      profileType: ProfileTypeId | null;
      draft: ProfileAiDraft | null;
      questions: MissingQuestion[];
      bio: string | null;
    }>("/api/v1/profile/onboarding/state")
      .then((state) => {
        if (state.profileType) setProfileType(state.profileType);
        if (state.draft) {
          setDraft(state.draft);
          setNarrative(state.draft.narrative);
          if (mode === "onboarding") setStep("review");
        } else if (state.bio && mode === "improve") {
          setNarrative(state.bio);
        }
        if (state.questions?.length) setQuestions(state.questions);
      })
      .catch(() => undefined);
  }, [mode]);

  const start = useCallback(async () => {
    setBusy(true);
    try {
      await api("/api/v1/profile/onboarding/start", { method: "POST" });
      setStep("type");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not start");
    } finally {
      setBusy(false);
    }
  }, []);

  const saveType = useCallback(async (type: ProfileTypeId) => {
    setProfileType(type);
    setBusy(true);
    try {
      await api("/api/v1/profile/type", {
        method: "POST",
        body: JSON.stringify({ profileType: type }),
      });
      setStep("tell");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save type");
    } finally {
      setBusy(false);
    }
  }, []);

  const analyze = useCallback(async () => {
    setBusy(true);
    setStep("analyzing");
    setQualityMessage(null);
    try {
      const result = await api<{
        draft: ProfileAiDraft | null;
        message: string | null;
        quality: string;
      }>("/api/v1/profile/ai/analyze", {
        method: "POST",
        body: JSON.stringify({
          narrative,
          profileType,
          linkedInUrl: linkedInUrl || null,
          websiteUrl: websiteUrl || null,
          portfolioUrl: portfolioUrl || null,
          keepExisting: mode === "improve",
        }),
      });
      if (!result.draft) {
        setQualityMessage(
          result.message ??
            "Let's add a little more detail so people can understand what you know and what you do.",
        );
        setStep("tell");
        return;
      }
      setDraft(result.draft);
      if (result.draft.typeMismatch && result.draft.suggestedType) {
        setTypeSuggestion(result.draft.suggestedType);
      }
      setStep("review");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Analysis failed");
      setStep("tell");
    } finally {
      setBusy(false);
    }
  }, [linkedInUrl, mode, narrative, portfolioUrl, profileType, websiteUrl]);

  const applyDraft = useCallback(async () => {
    if (!draft) return;
    setBusy(true);
    try {
      const result = await api<{
        readiness: IntelligenceReadinessResult;
        activation: { activated: boolean; missing: string[] };
      }>("/api/v1/profile/ai/apply", {
        method: "POST",
        body: JSON.stringify({ draft, acceptPending: true }),
      });
      setReadiness(result.readiness);
      const state = await api<{ questions: MissingQuestion[] }>(
        "/api/v1/profile/onboarding/state",
      );
      setQuestions(state.questions ?? []);
      setStep("questions");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }, [draft]);

  const finishQuestions = useCallback(async (skip: boolean) => {
    setBusy(true);
    try {
      if (!skip) {
        await api("/api/v1/profile/ai/missing", {
          method: "POST",
          body: JSON.stringify({
            discoveryIntent: intents,
            proudProject,
            helpTopics,
          }),
        });
      }
      const checked = await api<{
        activation: { activated: boolean; missing: string[] };
        readiness: IntelligenceReadinessResult;
        activationStatus: string;
      }>("/api/v1/profile/activation/check", { method: "POST" });
      setReadiness(checked.readiness);
      setActivated(Boolean(checked.activation?.activated));
      setStep(checked.activation?.activated ? "activated" : "ready");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not continue");
    } finally {
      setBusy(false);
    }
  }, [helpTopics, intents, proudProject]);

  const copy = PROFILE_TYPE_COPY[profileType];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="h-1 overflow-hidden rounded-full bg-[var(--surface)]">
        <div
          className="h-full bg-[var(--accent)] transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-[var(--muted)]">About 2 minutes</p>

      {step === "welcome" ? (
        <GlassCard className="space-y-4 p-8">
          <h1 className="font-display text-3xl font-bold">
            Tell us who you are
          </h1>
          <p className="text-[var(--muted-foreground)]">
            Smitvi AI will build your Intelligence Profile. You write naturally —
            we organize the rest.
          </p>
          <Button onClick={() => void start()} disabled={busy} size="lg">
            Continue
          </Button>
        </GlassCard>
      ) : null}

      {step === "type" ? (
        <div className="space-y-4">
          <h1 className="font-display text-3xl font-bold">What are you here as?</h1>
          <div className="grid gap-3">
            {PROFILE_TYPES.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => void saveType(id)}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-left hover:border-[var(--accent)]"
              >
                <p className="font-semibold">{PROFILE_TYPE_COPY[id].title}</p>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  {PROFILE_TYPE_COPY[id].description}
                </p>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {step === "tell" || step === "analyzing" ? (
        <GlassCard className="space-y-4 p-8">
          <h1 className="font-display text-3xl font-bold">
            Tell us about yourself
          </h1>
          <p className="text-[var(--muted-foreground)]">
            Write naturally. You don&apos;t need to fill complicated forms.
            Smitvi AI will help organize your experience.
          </p>
          <textarea
            value={narrative}
            onChange={(e) => setNarrative(e.target.value)}
            rows={7}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 text-sm"
            placeholder={copy.example}
            disabled={step === "analyzing"}
          />
          {qualityMessage ? (
            <p className="text-sm text-[var(--accent)]">{qualityMessage}</p>
          ) : null}
          <div className="grid gap-2 sm:grid-cols-3">
            <input
              className="rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
              placeholder="LinkedIn URL"
              value={linkedInUrl}
              onChange={(e) => setLinkedInUrl(e.target.value)}
            />
            <input
              className="rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
              placeholder="Website URL"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
            />
            <input
              className="rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
              placeholder="Portfolio URL"
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
            />
          </div>
          <Button onClick={() => void analyze()} disabled={busy || !narrative.trim()}>
            {step === "analyzing" ? "Analyzing…" : "Build my profile"}
          </Button>
        </GlassCard>
      ) : null}

      {step === "review" && draft ? (
        <GlassCard className="space-y-6 p-8">
          <h1 className="font-display text-3xl font-bold">
            Your Intelligence Profile
          </h1>
          {typeSuggestion ? (
            <div className="rounded-xl border border-[var(--border)] p-4 text-sm">
              <p>
                {draft.typeReason ??
                  "It sounds like you may be creating a Business profile. Would you like to switch?"}
              </p>
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setTypeSuggestion(null)}
                >
                  Keep current type
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setProfileType(typeSuggestion as ProfileTypeId);
                    setDraft({
                      ...draft,
                      profileType: typeSuggestion,
                      typeMismatch: false,
                    });
                    setTypeSuggestion(null);
                  }}
                >
                  Switch to {typeSuggestion}
                </Button>
              </div>
            </div>
          ) : null}
          <div>
            <p className="text-xs uppercase text-[var(--muted)]">Headline</p>
            <input
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
              value={draft.headline.value ?? ""}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  headline: {
                    ...draft.headline,
                    value: e.target.value,
                    status: "EDITED",
                    source: "USER",
                  },
                })
              }
            />
          </div>
          <div>
            <p className="text-xs uppercase text-[var(--muted)]">Summary</p>
            <textarea
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2"
              rows={4}
              value={draft.summary.value ?? ""}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  summary: {
                    ...draft.summary,
                    value: e.target.value,
                    status: "EDITED",
                    source: "USER",
                  },
                })
              }
            />
          </div>
          {draft.experienceYears.value != null ? (
            <p className="text-sm">
              Experience: {draft.experienceYears.value} years
            </p>
          ) : null}
          <EditableList
            title="Skills"
            items={draft.skills}
            onChange={(skills) => setDraft({ ...draft, skills })}
          />
          <EditableList
            title="Industries"
            items={draft.industries}
            onChange={(industries) => setDraft({ ...draft, industries })}
          />
          <EditableList
            title="Expertise"
            items={draft.expertiseAreas}
            onChange={(expertiseAreas) => setDraft({ ...draft, expertiseAreas })}
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={() => void applyDraft()} disabled={busy}>
              Looks good — Continue
            </Button>
            <Button variant="secondary" onClick={() => void analyze()} disabled={busy}>
              Improve with AI
            </Button>
          </div>
        </GlassCard>
      ) : null}

      {step === "questions" ? (
        <GlassCard className="space-y-6 p-8">
          <h1 className="font-display text-2xl font-bold">
            We&apos;ve built a good starting profile.
          </h1>
          <p className="text-[var(--muted-foreground)]">
            Let&apos;s improve it with {Math.min(questions.length, 3)} quick
            questions.
          </p>
          <div>
            <p className="font-medium">What do you want people to discover you for?</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {DISCOVERY_INTENT_OPTIONS.map((option) => {
                const on = intents.includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() =>
                      setIntents((prev) =>
                        on ? prev.filter((i) => i !== option) : [...prev, option],
                      )
                    }
                    className={`rounded-full border px-3 py-1 text-sm ${
                      on
                        ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                        : "border-[var(--border)]"
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
          {questions.some((q) => q.id === "proud_project") ? (
            <div>
              <p className="font-medium">
                Tell us about one project or achievement you&apos;re proud of.
              </p>
              <textarea
                className="mt-2 w-full rounded-lg border border-[var(--border)] bg-transparent p-3 text-sm"
                rows={4}
                value={proudProject}
                onChange={(e) => setProudProject(e.target.value)}
              />
            </div>
          ) : null}
          {questions.some((q) => q.id === "help_topics") ? (
            <div>
              <p className="font-medium">
                What are the main topics you can confidently help others with?
              </p>
              <textarea
                className="mt-2 w-full rounded-lg border border-[var(--border)] bg-transparent p-3 text-sm"
                rows={3}
                value={helpTopics}
                onChange={(e) => setHelpTopics(e.target.value)}
              />
            </div>
          ) : null}
          <div className="flex gap-2">
            <Button onClick={() => void finishQuestions(false)} disabled={busy}>
              Continue
            </Button>
            <Button
              variant="ghost"
              onClick={() => void finishQuestions(true)}
              disabled={busy}
            >
              Skip for now
            </Button>
          </div>
        </GlassCard>
      ) : null}

      {step === "ready" || step === "activated" ? (
        <GlassCard className="space-y-6 p-8">
          <h1 className="font-display text-3xl font-bold">
            {activated
              ? "Your Intelligence Profile is active"
              : "Your Intelligence Profile is taking shape"}
          </h1>
          <p className="text-lg">
            Your Intelligence Profile is {readiness?.score ?? 0}% ready.
          </p>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--surface)]">
            <div
              className="h-full bg-[var(--accent)]"
              style={{ width: `${readiness?.score ?? 0}%` }}
            />
          </div>
          {activated ? (
            <ul className="space-y-1 text-sm">
              <li>Appear in Smitvi discovery</li>
              <li>Build your Intelligence Graph</li>
              <li>Power your AI Twin</li>
              <li>Receive recommendations</li>
            </ul>
          ) : (
            <p className="text-sm text-[var(--muted-foreground)]">
              Add a few more confirmed details to activate. Recommended: add a
              project or confirm three skills.
            </p>
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild>
              <a href={ROUTES.profileSettings}>Add Project with AI</a>
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                router.replace(ROUTES.hub.dashboard);
                router.refresh();
              }}
            >
              Go to My Profile
            </Button>
          </div>
        </GlassCard>
      ) : null}
    </div>
  );
}
