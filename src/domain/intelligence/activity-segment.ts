export type ActivitySegment =
  | "ACTIVE_TODAY"
  | "ACTIVE_THIS_WEEK"
  | "ACTIVE_THIS_MONTH"
  | "AT_RISK"
  | "INACTIVE";

export function classifyActivitySegment(
  lastMeaningfulAt: Date | null,
  now = new Date(),
): ActivitySegment {
  if (!lastMeaningfulAt) return "INACTIVE";
  const hours = (now.getTime() - lastMeaningfulAt.getTime()) / 36e5;
  if (hours <= 24) return "ACTIVE_TODAY";
  if (hours <= 24 * 7) return "ACTIVE_THIS_WEEK";
  if (hours <= 24 * 14) return "ACTIVE_THIS_MONTH";
  if (hours <= 24 * 30) return "AT_RISK";
  return "INACTIVE";
}

export function canSendReengagement(
  lastNotifiedAt: Date | null,
  segment: ActivitySegment,
  now = new Date(),
): boolean {
  if (segment !== "AT_RISK" && segment !== "INACTIVE") return false;
  if (!lastNotifiedAt) return true;
  return now.getTime() - lastNotifiedAt.getTime() >= 24 * 36e5;
}

export function reengagementCopy(input: {
  missingProject: boolean;
  missingKnowledge: boolean;
  readinessScore: number;
}): { subject: string; body: string } {
  if (input.missingProject) {
    return {
      subject: "Add one project to make your AI Twin more useful",
      body: "Your AI Twin can answer better questions if you add one project.",
    };
  }
  if (input.missingKnowledge) {
    return {
      subject: "Your Intelligence Profile has easy improvements",
      body: "Your Intelligence Profile has 3 easy improvements that could make you more discoverable.",
    };
  }
  return {
    subject: "A small update would strengthen your Intelligence Profile",
    body: `Your Intelligence Readiness is ${input.readinessScore}. A two-minute update would help people discover what you know.`,
  };
}
