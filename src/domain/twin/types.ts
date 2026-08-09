import type { TwinCitation } from "@/application/chat/ask-twin";

export type TwinIntent =
  | "PERSONAL_FACT_RETRIEVAL"
  | "EXPERTISE_QUERY"
  | "EXPERIENCE_QUERY"
  | "PROJECT_QUERY"
  | "SKILL_QUERY"
  | "KNOWLEDGE_QUERY"
  | "CAREER_QUERY"
  | "PORTFOLIO_QUERY"
  | "RECOMMENDATION_QUERY"
  | "COMPARISON_QUERY"
  | "EXPLANATION_QUERY"
  | "CONTENT_GENERATION"
  | "LEARNING_QUERY"
  | "CONVERSATIONAL"
  | "UNKNOWN";

export type TwinSource =
  | "GRAPH"
  | "RAG"
  | "PROFILE"
  | "MEMORY"
  | "RECOMMENDATION"
  | "NONE";

export type TwinConfidenceLevel = "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";

export type TwinClaimLevel = "VERIFIED" | "SUPPORTED" | "INFERRED" | "UNKNOWN";

export type TwinResponseMode = "factual" | "representative";

export type TwinCitationType =
  | "DOCUMENT"
  | "PROFILE"
  | "PROJECT"
  | "EXPERIENCE"
  | "GRAPH"
  | "PORTFOLIO"
  | "ARTICLE"
  | "VIDEO"
  | "COURSE"
  | "USER_VERIFIED";

export type TwinEvidenceItem = {
  id: string;
  type: TwinCitationType;
  title: string;
  excerpt: string;
  reference?: string | null;
  confidence: number;
  claimLevel: TwinClaimLevel;
  sourceId?: string;
  chunkId?: string;
  graphRelationshipId?: string;
  verified: boolean;
};

export type TwinUnderstanding = {
  intent: TwinIntent;
  entities: string[];
  subject: "twin_owner" | "other_expert";
  requiredSources: TwinSource[];
  rawQuestion: string;
};

export type TwinQueryPlan = {
  sources: TwinSource[];
  useLlm: boolean;
  maxGraphEntities: number;
  rationale: string;
};

export type TwinGraphBundle = {
  skills: string[];
  expertise: string[];
  projects: string[];
  companies: string[];
  industries: string[];
  technologies: string[];
  topics: string[];
  focusEntities: string[];
  evidence: TwinEvidenceItem[];
  summaryLines: string[];
};

export type TwinContradiction = {
  field: string;
  valueA: string;
  sourceA: string;
  valueB: string;
  sourceB: string;
};

export type TwinPreparedIntelligence = {
  understanding: TwinUnderstanding;
  plan: TwinQueryPlan;
  graph: TwinGraphBundle | null;
  profileBlock: string | null;
  memoryBlock: string | null;
  recommendationBlock: string | null;
  evidence: TwinEvidenceItem[];
  contradictions: TwinContradiction[];
  citations: TwinCitation[];
  extendedCitations: TwinEvidenceItem[];
  contextBlocks: string[];
  systemPrompt: string;
  confidence: number;
  confidenceLevel: TwinConfidenceLevel;
  claimLevel: TwinClaimLevel;
  canAnswer: boolean;
  relatedQuestions: string[];
  suggestedActions: string[];
  retrievalMeta: {
    graphUsed: boolean;
    ragUsed: boolean;
    ragChunkCount: number;
  };
  deterministicFallback?: string | null;
  insufficientReply?: string;
};

export type TwinFeedbackType =
  | "HELPFUL"
  | "NOT_HELPFUL"
  | "CORRECT"
  | "INCORRECT"
  | "MISSING"
  | "HALLUCINATION";
