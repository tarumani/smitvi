export const READINESS_WEIGHTS = {
  identity: 10,
  summary: 10,
  skills: 15,
  experience: 15,
  project: 15,
  knowledge: 15,
  graph: 10,
  verification: 10,
} as const;

export type ReadinessDimension = keyof typeof READINESS_WEIGHTS;

export type ReadinessRecommendation = {
  action: "ADD_PROJECT" | "ADD_KNOWLEDGE" | "ADD_SKILLS" | "ADD_EXPERIENCE" | "VERIFY_FACTS";
  points: number;
  message: string;
};

export type IntelligenceReadinessResult = {
  score: number;
  level:
    | "STARTING"
    | "BUILDING"
    | "GROWING"
    | "INTELLIGENT"
    | "INTELLIGENCE_READY";
  completed: ReadinessDimension[];
  missing: ReadinessDimension[];
  recommendations: ReadinessRecommendation[];
};

export type IntelligenceReadinessInput = {
  hasUsername: boolean;
  hasProfileType: boolean;
  hasMeaningfulSummary: boolean;
  confirmedSkillCount: number;
  hasExperience: boolean;
  hasProject: boolean;
  knowledgeReadyCount: number;
  graphConnectionCount: number;
  userVerifiedFactCount: number;
};

export function readinessLevel(
  score: number,
): IntelligenceReadinessResult["level"] {
  if (score <= 20) return "STARTING";
  if (score <= 40) return "BUILDING";
  if (score <= 60) return "GROWING";
  if (score <= 80) return "INTELLIGENT";
  return "INTELLIGENCE_READY";
}

export function calculateIntelligenceReadiness(
  input: IntelligenceReadinessInput,
): IntelligenceReadinessResult {
  const completed: ReadinessDimension[] = [];
  const missing: ReadinessDimension[] = [];
  const recommendations: ReadinessRecommendation[] = [];
  let score = 0;

  if (input.hasUsername && input.hasProfileType) {
    score += READINESS_WEIGHTS.identity;
    completed.push("identity");
  } else {
    missing.push("identity");
  }

  if (input.hasMeaningfulSummary) {
    score += READINESS_WEIGHTS.summary;
    completed.push("summary");
  } else {
    missing.push("summary");
  }

  if (input.confirmedSkillCount >= 3) {
    score += READINESS_WEIGHTS.skills;
    completed.push("skills");
  } else {
    missing.push("skills");
    recommendations.push({
      action: "ADD_SKILLS",
      points: READINESS_WEIGHTS.skills,
      message: "Confirm at least three skills so people understand your expertise.",
    });
  }

  if (input.hasExperience) {
    score += READINESS_WEIGHTS.experience;
    completed.push("experience");
  } else {
    missing.push("experience");
    recommendations.push({
      action: "ADD_EXPERIENCE",
      points: READINESS_WEIGHTS.experience,
      message: "Add one experience record to strengthen your Intelligence Profile.",
    });
  }

  if (input.hasProject) {
    score += READINESS_WEIGHTS.project;
    completed.push("project");
  } else {
    missing.push("project");
    recommendations.push({
      action: "ADD_PROJECT",
      points: READINESS_WEIGHTS.project,
      message: "Add one project to improve your Intelligence Profile.",
    });
  }

  if (input.knowledgeReadyCount > 0) {
    score += READINESS_WEIGHTS.knowledge;
    completed.push("knowledge");
  } else {
    missing.push("knowledge");
    recommendations.push({
      action: "ADD_KNOWLEDGE",
      points: READINESS_WEIGHTS.knowledge,
      message: "Share knowledge to make your AI Twin smarter.",
    });
  }

  if (input.graphConnectionCount >= 3) {
    score += READINESS_WEIGHTS.graph;
    completed.push("graph");
  } else {
    missing.push("graph");
  }

  if (input.userVerifiedFactCount >= 3) {
    score += READINESS_WEIGHTS.verification;
    completed.push("verification");
  } else {
    missing.push("verification");
    recommendations.push({
      action: "VERIFY_FACTS",
      points: READINESS_WEIGHTS.verification,
      message: "Review and confirm AI suggestions so they become verified facts.",
    });
  }

  const capped = Math.min(100, score);
  return {
    score: capped,
    level: readinessLevel(capped),
    completed,
    missing,
    recommendations: recommendations.slice(0, 3),
  };
}
