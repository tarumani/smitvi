export const DEFAULT_GROWTH_WEIGHTS = {
  demandMatch: 0.25,
  creatorSignals: 0.2,
  monetization: 0.2,
  networkGap: 0.15,
  lookalike: 0.1,
  referral: 0.1,
} as const;

export type GrowthScoreBreakdown = {
  demandMatch: number;
  creatorSignals: number;
  monetization: number;
  networkGap: number;
  lookalike: number;
  referral: number;
  why: string[];
};

export type GrowthDailyBrief = {
  date: string;
  prospectsDiscovered: number;
  qualified: number;
  pendingReview: number;
  registered: number;
  activated: number;
  topOpportunity: string | null;
  recommendedAction: string;
};
