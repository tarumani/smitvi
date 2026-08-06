"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "smitvi_onboarding_draft_v1";

export type OnboardingDraft = {
  profession?: string;
  interests?: string[];
  bioHint?: string;
  updatedAt: string;
};

export function saveOnboardingDraft(partial: Omit<OnboardingDraft, "updatedAt">) {
  if (typeof window === "undefined") return;
  const prev = loadOnboardingDraft();
  const next: OnboardingDraft = {
    ...prev,
    ...partial,
    updatedAt: new Date().toISOString(),
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function loadOnboardingDraft(): OnboardingDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OnboardingDraft;
  } catch {
    return null;
  }
}

export function clearOnboardingDraft() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function useOnboardingDraft() {
  const [draft, setDraft] = useState<OnboardingDraft | null>(null);

  useEffect(() => {
    setDraft(loadOnboardingDraft());
  }, []);

  return {
    draft,
    save: (partial: Omit<OnboardingDraft, "updatedAt">) => {
      saveOnboardingDraft(partial);
      setDraft(loadOnboardingDraft());
    },
    clear: () => {
      clearOnboardingDraft();
      setDraft(null);
    },
  };
}
