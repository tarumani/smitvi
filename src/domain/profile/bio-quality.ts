export const BIO_QUALITY = [
  "EMPTY",
  "LOW_QUALITY",
  "BASIC",
  "GOOD",
  "HIGH_QUALITY",
] as const;

export type BioQuality = (typeof BIO_QUALITY)[number];

const LOW_QUALITY_EXACT = new Set([
  "hello",
  "hi",
  "hey",
  "student",
  "fashion",
  "test",
  "asdf",
  "n/a",
  "na",
  "none",
  "idk",
]);

const MARKETING_SNIPPETS = [
  "welcome to my page",
  "welcome to my profile",
  "click the link",
  "follow me",
  "best in class",
  "world class solutions",
  "synergy",
  "lorem ipsum",
];

export function classifyBioQuality(text: string | null | undefined): BioQuality {
  const raw = (text ?? "").trim();
  if (!raw) return "EMPTY";

  const normalized = raw.toLowerCase().replace(/\s+/g, " ");
  const words = normalized.split(" ").filter(Boolean);
  const letterCount = raw.replace(/[^a-zA-Z]/g, "").length;

  if (letterCount < 8 || words.length <= 2 || LOW_QUALITY_EXACT.has(normalized)) {
    return "LOW_QUALITY";
  }

  if (MARKETING_SNIPPETS.some((s) => normalized.includes(s))) {
    return "LOW_QUALITY";
  }

  const hasRoleSignal =
    /\b(i am|i'm|designer|developer|engineer|consultant|teacher|founder|writer|marketer|doctor|lawyer|researcher|student of)\b/i.test(
      raw,
    );
  const hasSkillSignal =
    /\b(figma|react|python|design|marketing|healthcare|saas|ux|ui|teach|help)\b/i.test(
      raw,
    );
  const hasYears = /\b\d+\s*\+?\s*(years?|yrs?)\b/i.test(raw);

  if (words.length < 8) return "BASIC";
  if (hasRoleSignal && (hasSkillSignal || hasYears) && words.length >= 18) {
    return "HIGH_QUALITY";
  }
  if (hasRoleSignal || hasSkillSignal || hasYears) return "GOOD";
  if (words.length >= 12) return "BASIC";
  return "LOW_QUALITY";
}

export function bioQualityPrompt(quality: BioQuality): string | null {
  if (quality === "EMPTY" || quality === "LOW_QUALITY") {
    return "Tell us your role, experience, skills and what you enjoy working on.";
  }
  return null;
}
