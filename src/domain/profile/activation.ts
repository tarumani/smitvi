import type { ProfileType } from "@/generated/prisma/client";
import { classifyBioQuality } from "@/domain/profile/bio-quality";

export const PROFILE_TYPES = [
  "PROFESSIONAL",
  "CREATOR",
  "FREELANCER",
  "EDUCATOR",
  "FOUNDER",
  "STUDENT",
] as const;

export type ProfileTypeId = (typeof PROFILE_TYPES)[number];

export const ACTIVATION_STATUS_ORDER = [
  "REGISTERED",
  "ONBOARDING_STARTED",
  "PROFILE_DRAFTED",
  "PROFILE_REVIEWED",
  "PROFILE_ACTIVATED",
  "INTELLIGENCE_READY",
  "DISCOVERABLE",
  "MONETIZABLE",
] as const;

export type ActivationStatus = (typeof ACTIVATION_STATUS_ORDER)[number];

/** Profile has not met the activation quality bar yet. */
export const INCOMPLETE_ACTIVATION_STATUSES = [
  "REGISTERED",
  "ONBOARDING_STARTED",
  "PROFILE_DRAFTED",
  "PROFILE_REVIEWED",
] as const;

export type IncompleteActivationStatus =
  (typeof INCOMPLETE_ACTIVATION_STATUSES)[number];

export const ACTIVATION_MISSING_LABELS: Record<string, string> = {
  username: "Username",
  profileType: "Profile type",
  headlineOrSummary: "Headline or summary",
  skills: "At least 3 skills",
  expertiseOrIndustry: "Expertise or industry",
};

export function isIncompleteActivationStatus(
  status: string | null | undefined,
): boolean {
  return (
    !status ||
    (INCOMPLETE_ACTIVATION_STATUSES as readonly string[]).includes(status)
  );
}

export const PROFILE_TYPE_COPY: Record<
  ProfileTypeId,
  { title: string; description: string; example: string }
> = {
  PROFESSIONAL: {
    title: "Professional",
    description: "Build your expertise and get discovered.",
    example:
      "I am a UI/UX designer with 8 years of experience. I have worked on healthcare, education and SaaS products. I specialize in mobile and web applications and use Figma.",
  },
  CREATOR: {
    title: "Creator",
    description: "Share knowledge and build an audience.",
    example:
      "I am a full-stack developer specializing in React, Node.js and cloud applications. I have worked on fintech and SaaS products.",
  },
  FREELANCER: {
    title: "Freelancer / Consultant",
    description: "Showcase expertise and find opportunities.",
    example:
      "I help small businesses improve their digital marketing, branding and customer acquisition.",
  },
  EDUCATOR: {
    title: "Educator / Mentor",
    description: "Turn knowledge into guides, learning and AI assistance.",
    example:
      "I teach web development and UI/UX design. I create tutorials, courses and mentoring programs.",
  },
  FOUNDER: {
    title: "Founder / Business",
    description: "Build an intelligence profile for your business or organization.",
    example:
      "I run a product studio that designs digital experiences for healthcare and education companies.",
  },
  STUDENT: {
    title: "Student / Learner",
    description: "Build your skills and discover people and knowledge.",
    example:
      "I am studying computer science and learning React, product design, and how to ship side projects.",
  },
};

export const PROFILE_TYPE_TO_ARCHETYPE: Record<ProfileTypeId, string> = {
  PROFESSIONAL: "OTHER",
  CREATOR: "AI_CREATOR",
  FREELANCER: "AI_CONSULTANT",
  EDUCATOR: "AI_TEACHER",
  FOUNDER: "BUSINESS",
  STUDENT: "OTHER",
};

export type ActivationInput = {
  username: string | null | undefined;
  profileType: ProfileType | ProfileTypeId | null | undefined;
  headline: string | null | undefined;
  bio: string | null | undefined;
  confirmedSkillCount: number;
  expertiseCount: number;
  industryCount: number;
};

export type ActivationResult = {
  activated: boolean;
  missing: string[];
};

export function evaluateActivation(input: ActivationInput): ActivationResult {
  const missing: string[] = [];
  if (!input.username?.trim() || input.username.trim().length < 3) {
    missing.push("username");
  }
  if (!input.profileType) missing.push("profileType");

  const headline = input.headline?.trim() ?? "";
  const bio = input.bio?.trim() ?? "";
  const quality = classifyBioQuality(bio || headline);
  const hasMeaningfulCopy =
    headline.length >= 8 ||
    (bio.length >= 24 && quality !== "EMPTY" && quality !== "LOW_QUALITY");
  if (!hasMeaningfulCopy) missing.push("headlineOrSummary");

  if (input.confirmedSkillCount < 3) missing.push("skills");
  if (input.expertiseCount < 1 && input.industryCount < 1) {
    missing.push("expertiseOrIndustry");
  }

  return { activated: missing.length === 0, missing };
}

export function maxActivationStatus(
  current: ActivationStatus,
  next: ActivationStatus,
): ActivationStatus {
  return ACTIVATION_STATUS_ORDER.indexOf(next) >
    ACTIVATION_STATUS_ORDER.indexOf(current)
    ? next
    : current;
}

export type IntelligenceReadyInput = {
  activated: boolean;
  confirmedSkillCount: number;
  hasProjectOrExperience: boolean;
  hasKnowledgeOrExpertise: boolean;
  graphConnectionCount: number;
  verifiedEvidenceCount: number;
};

export function evaluateIntelligenceReady(
  input: IntelligenceReadyInput,
): { ready: boolean; missing: string[] } {
  const missing: string[] = [];
  if (!input.activated) missing.push("activation");
  if (input.confirmedSkillCount < 3) missing.push("confirmedSkills");
  if (!input.hasProjectOrExperience) missing.push("projectOrExperience");
  if (!input.hasKnowledgeOrExpertise) missing.push("knowledgeOrExpertise");
  if (input.graphConnectionCount < 3) missing.push("graphConnections");
  if (input.verifiedEvidenceCount < 2) missing.push("evidenceQuality");
  return { ready: missing.length === 0, missing };
}
