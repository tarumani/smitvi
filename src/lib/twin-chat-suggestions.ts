import type { ProfileSummary } from "@/domain/profile/entities";

/** Owner Twin Chat prompts — grounded in profile, not random doc FAQs. */
export function ownerTwinChatSuggestions(
  profile: ProfileSummary | null,
  readySourceCount: number,
): string[] {
  const questions: string[] = [];

  if (profile?.headline?.trim()) {
    questions.push(
      `What can you help with as a ${profile.headline.trim()}?`,
    );
  }
  if (profile?.bio?.trim()) {
    questions.push("Summarize my background and expertise in a few sentences");
  }
  if (profile?.displayName) {
    questions.push(
      `What should visitors ask ${profile.displayName}'s Twin first?`,
    );
  }
  if (readySourceCount > 0) {
    questions.push("What topics from my uploaded knowledge can you answer?");
  } else {
    questions.push("What should I upload to train my Twin?");
  }

  const unique = Array.from(new Set(questions.map((q) => q.trim()))).filter(
    Boolean,
  );
  return unique.slice(0, 4);
}
