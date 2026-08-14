import type { ProfileTypeId } from "@/domain/profile/activation";
import type { ProfileAiDraft } from "@/domain/profile/profile-extraction";
import { acceptedValues } from "@/domain/profile/profile-extraction";

export type MissingQuestionId =
  | "discovery_intent"
  | "proud_project"
  | "help_topics";

export type MissingQuestion = {
  id: MissingQuestionId;
  prompt: string;
  kind: "multi" | "narrative";
  options?: string[];
};

export const DISCOVERY_INTENT_OPTIONS = [
  "Finding work",
  "Getting clients",
  "Consulting",
  "Collaboration",
  "Teaching",
  "Sharing knowledge",
  "Building an audience",
];

export function selectMissingQuestions(input: {
  profileType: ProfileTypeId | string | null;
  draft: ProfileAiDraft | null;
  confirmedSkillCount: number;
  hasProject: boolean;
  expertiseCount: number;
}): MissingQuestion[] {
  const questions: MissingQuestion[] = [];
  const skills = input.draft
    ? acceptedValues(input.draft.skills).length || input.draft.skills.length
    : input.confirmedSkillCount;

  questions.push({
    id: "discovery_intent",
    prompt: "What do you want people to discover you for?",
    kind: "multi",
    options: DISCOVERY_INTENT_OPTIONS,
  });

  if (!input.hasProject) {
    questions.push({
      id: "proud_project",
      prompt: "Tell us about one project or achievement you're proud of.",
      kind: "narrative",
    });
  }

  if (skills < 5 || input.expertiseCount < 1) {
    questions.push({
      id: "help_topics",
      prompt: "What are the main topics you can confidently help others with?",
      kind: "narrative",
    });
  }

  return questions.slice(0, 3);
}
