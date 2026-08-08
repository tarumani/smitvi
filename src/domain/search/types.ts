import type { GraphEntityType } from "@/generated/prisma/client";

export const SEARCH_INTENTS = [
  "EXPERT_DISCOVERY",
  "SKILL_DISCOVERY",
  "TOPIC_DISCOVERY",
  "PROJECT_DISCOVERY",
  "COMPANY_DISCOVERY",
  "KNOWLEDGE_DISCOVERY",
  "MENTOR_DISCOVERY",
  "COLLABORATOR_DISCOVERY",
] as const;

export type SearchIntent = (typeof SEARCH_INTENTS)[number];

export type EntityRequirement = "REQUIRED" | "OPTIONAL" | "OR";

export type InterpretedEntity = {
  type: GraphEntityType | "KEYWORD";
  value: string;
  requirement: EntityRequirement;
  orGroup?: string;
  graphEntityId?: string | null;
  resolved: boolean;
};

export type SearchFilters = {
  profession?: string;
  skill?: string;
  industry?: string;
  technology?: string;
  location?: string;
  verifiedOnly?: boolean;
};

export type InterpretedQuery = {
  raw: string;
  normalized: string;
  intent: SearchIntent;
  entities: InterpretedEntity[];
  filters: SearchFilters;
};

export type SearchCategory =
  | "all"
  | "people"
  | "knowledge"
  | "projects"
  | "skills"
  | "companies"
  | "topics"
  | "questions";

export type MatchEvidenceItem = {
  label: string;
  verified: boolean;
  sourceType?: string;
  excerpt?: string | null;
};

export type ExpertMatchBreakdown = {
  skillMatch: number;
  industryMatch: number;
  projectMatch: number;
  technologyMatch: number;
  experienceMatch: number;
  knowledgeMatch: number;
  semanticSimilarity: number;
  evidenceStrength: number;
  verificationScore: number;
  profileCompleteness: number;
  freshnessScore: number;
  reputationBoost: number;
  graphConnectivity: number;
};

export type RankedExpertResult = {
  userId: string;
  username: string;
  displayName: string;
  headline: string | null;
  avatarUrl: string | null;
  profession: string | null;
  location: string | null;
  reputationScore: number;
  intelligencePoints: number;
  ratingAverage: number;
  followersCount: number;
  overallMatch: number;
  breakdown: ExpertMatchBreakdown;
  matchedCriteria: string[];
  unverifiedCriteria: string[];
  topSkills: string[];
  industries: string[];
  projects: string[];
  evidence: MatchEvidenceItem[];
  whyMatch: string[];
};

export type UnifiedSearchResponse = {
  interpretedQuery: InterpretedQuery;
  total: number;
  experts: RankedExpertResult[];
  knowledge: Awaited<
    ReturnType<
      import("@/infrastructure/database/repositories/search-repository").PrismaSearchRepository["search"]
    >
  >["knowledge"];
  skills: Array<{ name: string; slug: string; profileCount: number }>;
  topics: Array<{ topic: string; sourceCount: number }>;
  projects: Array<{ id: string; name: string; ownerUsername: string }>;
  partialMatchExperts?: RankedExpertResult[];
  knowledgeGap?: {
    message: string;
    satisfied: string[];
    missing: string[];
    partialCount: number;
  };
  rankingExplanation: string;
};
