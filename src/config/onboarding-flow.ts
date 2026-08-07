import type { HubArchetypeId } from "@/config/brand";

/** Ordered activation funnel — one screen per step. Account unlocks after `bio`. */
export const ONBOARDING_FLOW_STEPS = [
  "welcome",
  "profession",
  "interests",
  "photo",
  "bio",
  "knowledge",
  "follow",
  "score",
] as const;

export type OnboardingFlowStep = (typeof ONBOARDING_FLOW_STEPS)[number];

export const ONBOARDING_STEP_LABELS: Record<OnboardingFlowStep, string> = {
  welcome: "Welcome",
  profession: "Profession",
  interests: "Interests",
  photo: "Photo",
  bio: "Bio",
  knowledge: "Knowledge",
  follow: "Follow",
  score: "Score",
};

export const ONBOARDING_PROFESSIONS = [
  { id: "STUDENT", label: "Student", archetype: "OTHER" as HubArchetypeId },
  { id: "UI_UX", label: "UI/UX Designer", archetype: "AI_DESIGNER" },
  { id: "DEVELOPER", label: "Developer", archetype: "AI_DEVELOPER" },
  { id: "DOCTOR", label: "Doctor", archetype: "AI_CONSULTANT" },
  { id: "TEACHER", label: "Teacher", archetype: "AI_TEACHER" },
  { id: "ENTREPRENEUR", label: "Entrepreneur", archetype: "BUSINESS" },
  { id: "WRITER", label: "Writer", archetype: "AI_CREATOR" },
  { id: "MARKETING", label: "Marketing", archetype: "AI_CREATOR" },
  { id: "BUSINESS", label: "Business", archetype: "BUSINESS" },
  { id: "OTHER", label: "Other", archetype: "OTHER" },
] as const;

export type ProfessionId = (typeof ONBOARDING_PROFESSIONS)[number]["id"];

export const ONBOARDING_INTERESTS = [
  "Artificial Intelligence",
  "Technology",
  "Design",
  "Programming",
  "Finance",
  "Healthcare",
  "Education",
  "Photography",
  "Music",
  "Travel",
  "Business",
  "Marketing",
  "Sports",
  "Science",
  "Startups",
  "Product",
  "Data",
  "Writing",
] as const;

export const INTELLIGENCE_POINT_WEIGHTS = {
  profilePicture: 10,
  profession: 10,
  interests: 10,
  bio: 10,
  knowledgeUpload: 40,
  resumeUpload: 30,
  portfolio: 20,
  firstPost: 20,
  followExperts: 10,
  emailVerified: 10,
} as const;

export const INTELLIGENCE_MAX_SCORE = 100;

export const INTELLIGENCE_BADGES = [
  { id: "explorer", label: "Explorer", minScore: 15 },
  { id: "contributor", label: "Contributor", minScore: 35 },
  { id: "knowledge_creator", label: "Knowledge Creator", minScore: 55 },
  { id: "verified_expert", label: "Verified Expert", minScore: 75 },
  { id: "hi_pro", label: "Human Intelligence Pro", minScore: 90 },
] as const;

/** Maps pre–v2 onboarding step ids to the current funnel. */
const LEGACY_ONBOARDING_STEPS: Record<string, OnboardingFlowStep> = {
  archetype: "profession",
  profile: "bio",
  connect: "knowledge",
  build: "follow",
  celebrate: "score",
};

export function normalizeOnboardingStep(
  step: string | null | undefined,
): OnboardingFlowStep {
  if (step && ONBOARDING_FLOW_STEPS.includes(step as OnboardingFlowStep)) {
    return step as OnboardingFlowStep;
  }
  if (step && step in LEGACY_ONBOARDING_STEPS) {
    return LEGACY_ONBOARDING_STEPS[step];
  }
  return "welcome";
}

export function onboardingStepIndex(step: string | null | undefined): number {
  const normalized = normalizeOnboardingStep(step);
  return ONBOARDING_FLOW_STEPS.indexOf(normalized);
}

export function onboardingProgressPercent(step: string | null | undefined): number {
  const idx = onboardingStepIndex(step);
  return Math.round((idx / ONBOARDING_FLOW_STEPS.length) * 100);
}

export function nextOnboardingStep(
  current: string | null | undefined,
): OnboardingFlowStep | null {
  const idx = onboardingStepIndex(current);
  if (idx >= ONBOARDING_FLOW_STEPS.length - 1) return null;
  return ONBOARDING_FLOW_STEPS[idx + 1];
}

export function routeForOnboardingStep(step: OnboardingFlowStep): string {
  return `/onboarding/${step}`;
}
