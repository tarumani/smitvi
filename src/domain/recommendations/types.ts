import type { RankedExpertResult } from "@/domain/search/types";

export type RecommendationKind =
  | "expert"
  | "similar_expert"
  | "complementary_expert"
  | "mentor"
  | "collaborator"
  | "follow"
  | "knowledge"
  | "learning_gap"
  | "opportunity";

export type ExplainableRecommendation = {
  id: string;
  kind: RecommendationKind;
  targetType: "user" | "knowledge" | "topic" | "skill" | "opportunity";
  targetId: string;
  title: string;
  subtitle?: string | null;
  overallMatch: number;
  breakdown?: Record<string, number>;
  why: string[];
  actions: Array<"follow" | "message" | "profile" | "save" | "dismiss">;
  expert?: RankedExpertResult;
  metadata?: Record<string, unknown>;
};

export type LearningGapItem = {
  skillOrTopic: string;
  whyItMatters: string;
  suggestedLearning: string[];
  relatedExpertUsernames: string[];
};

export type IntelligenceMapNode = {
  id: string;
  label: string;
  type: string;
  level: 0 | 1 | 2;
  confidence?: number;
  verificationStatus?: string;
  description?: string | null;
  evidenceCount?: number;
};

export type IntelligenceMapEdge = {
  id: string;
  source: string;
  target: string;
  relationshipType: string;
  confidence: number;
};

export type IntelligenceMapPayload = {
  nodes: IntelligenceMapNode[];
  edges: IntelligenceMapEdge[];
  filters: string[];
};

export type ForYouFeed = {
  peopleYouShouldKnow: ExplainableRecommendation[];
  knowledgeForYou: ExplainableRecommendation[];
  skillsToExplore: ExplainableRecommendation[];
  projectsYouMayLike: ExplainableRecommendation[];
  collaborators: ExplainableRecommendation[];
  opportunities: ExplainableRecommendation[];
  trendingInExpertise: ExplainableRecommendation[];
  learningGaps: LearningGapItem[];
};

export type RecommendationBundle = {
  experts: ExplainableRecommendation[];
  similar: ExplainableRecommendation[];
  complementary: ExplainableRecommendation[];
  mentors: ExplainableRecommendation[];
  collaborators: ExplainableRecommendation[];
  follow: ExplainableRecommendation[];
  knowledge: ExplainableRecommendation[];
  opportunities: ExplainableRecommendation[];
  learningGaps: LearningGapItem[];
};
