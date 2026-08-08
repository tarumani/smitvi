import type { GrowthScoreBreakdown } from "@/domain/growth/types";
import { DEFAULT_GROWTH_WEIGHTS } from "@/domain/growth/types";
import { prisma } from "@/infrastructure/database/prisma";

export type ScoringInput = {
  skills: string[];
  topics: string[];
  profession?: string | null;
  portfolioUrl?: string | null;
  website?: string | null;
  publicSignals?: Record<string, unknown>;
  demandScore?: number;
  networkGapScore?: number;
  lookalikeScore?: number;
  referralBoost?: number;
};

function clamp100(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function computeCreatorPotential(input: ScoringInput): number {
  let score = 35;
  if (input.portfolioUrl) score += 20;
  if (input.website) score += 8;
  const signals = input.publicSignals ?? {};
  if (signals.hasTeachingContent === true) score += 15;
  if (signals.hasConsulting === true) score += 10;
  if (signals.hasProducts === true) score += 12;
  if (input.skills.length >= 3) score += 10;
  if (experienceYearsHint(input as ScoringInput & { experienceYears?: number | null })) {
    score += 5;
  }
  return clamp100(score);
}

function experienceYearsHint(input: ScoringInput & { experienceYears?: number | null }): boolean {
  const years =
    (input as { experienceYears?: number | null }).experienceYears ??
    (typeof input.publicSignals?.experienceYears === "number"
      ? (input.publicSignals.experienceYears as number)
      : null);
  return years != null && years >= 3;
}

export function computeMonetizationPotential(input: ScoringInput): number {
  let score = 30;
  const prof = (input.profession ?? "").toLowerCase();
  if (/design|ux|ui|consult|coach|teach|developer|engineer/.test(prof)) {
    score += 15;
  }
  if (input.portfolioUrl) score += 18;
  if (input.skills.some((s) => /figma|react|python|healthcare/i.test(s))) {
    score += 12;
  }
  const paths = inferMonetizationPaths(input);
  score += Math.min(25, paths.length * 8);
  return clamp100(score);
}

export function inferMonetizationPaths(input: ScoringInput): string[] {
  const paths: string[] = [];
  const blob = [
    input.profession ?? "",
    ...input.skills,
    ...input.topics,
  ]
    .join(" ")
    .toLowerCase();
  if (/ux|design|figma/.test(blob)) {
    paths.push("Templates", "Portfolio reviews", "Consultation");
  }
  if (/consult|coach/.test(blob)) paths.push("Consultation", "AI Twin subscription");
  if (/teach|course|educat/.test(blob)) paths.push("Course", "Prompt packs");
  if (paths.length === 0) paths.push("AI Twin subscription", "Knowledge products");
  return [...new Set(paths)];
}

export function computeOverallGrowthScore(
  breakdown: Omit<GrowthScoreBreakdown, "why">,
  weights: Record<string, number> = DEFAULT_GROWTH_WEIGHTS,
): number {
  const w = { ...DEFAULT_GROWTH_WEIGHTS, ...weights };
  const total =
    breakdown.demandMatch * w.demandMatch +
    breakdown.creatorSignals * w.creatorSignals +
    breakdown.monetization * w.monetization +
    breakdown.networkGap * w.networkGap +
    breakdown.lookalike * w.lookalike +
    breakdown.referral * w.referral;
  return clamp100(total);
}

export class GrowthScoringService {
  async getActiveWeights(): Promise<Record<string, number>> {
    const latest = await prisma.growthModelVersion.findFirst({
      orderBy: { createdAt: "desc" },
    });
    if (!latest?.weights || typeof latest.weights !== "object") {
      return { ...DEFAULT_GROWTH_WEIGHTS };
    }
    return { ...DEFAULT_GROWTH_WEIGHTS, ...(latest.weights as Record<string, number>) };
  }

  scoreProspect(input: ScoringInput & { experienceYears?: number | null }): {
    smitviFitScore: number;
    creatorPotentialScore: number;
    monetizationPotentialScore: number;
    networkValueScore: number;
    overallGrowthScore: number;
    breakdown: GrowthScoreBreakdown;
  } {
    const creatorPotentialScore = computeCreatorPotential(input);
    const monetizationPotentialScore = computeMonetizationPotential(input);
    const demandMatch = clamp100(input.demandScore ?? 50);
    const networkGap = clamp100(input.networkGapScore ?? 50);
    const lookalike = clamp100(input.lookalikeScore ?? 40);
    const referral = clamp100(input.referralBoost ?? 0);

    const creatorSignals = creatorPotentialScore;
    const monetization = monetizationPotentialScore;

    const breakdown: GrowthScoreBreakdown = {
      demandMatch,
      creatorSignals,
      monetization,
      networkGap,
      lookalike,
      referral,
      why: [],
    };

    if (demandMatch >= 70) breakdown.why.push("High search or marketplace demand");
    if (networkGap >= 70) breakdown.why.push("Fills an underrepresented expertise gap");
    if (creatorPotentialScore >= 70) breakdown.why.push("Strong creator signals (portfolio/content)");
    if (monetizationPotentialScore >= 70) breakdown.why.push("Multiple monetization paths on Smitvi");
    if (lookalike >= 65) breakdown.why.push("Similar to successful Smitvi creators");
    if (breakdown.why.length === 0) breakdown.why.push("Moderate fit — review manually");

    const smitviFitScore = clamp100(
      demandMatch * 0.35 + networkGap * 0.35 + lookalike * 0.2 + referral * 0.1,
    );
    const networkValueScore = clamp100(networkGap * 0.6 + demandMatch * 0.4);

    const overallGrowthScore = computeOverallGrowthScore(breakdown);

    return {
      smitviFitScore,
      creatorPotentialScore,
      monetizationPotentialScore,
      networkValueScore,
      overallGrowthScore,
      breakdown,
    };
  }
}
