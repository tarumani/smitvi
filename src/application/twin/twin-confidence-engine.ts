import type {
  TwinClaimLevel,
  TwinConfidenceLevel,
  TwinEvidenceItem,
} from "@/domain/twin/types";

export type TwinConfidenceResult = {
  score: number;
  level: TwinConfidenceLevel;
  claimLevel: TwinClaimLevel;
};

export class TwinConfidenceEngine {
  compute(input: {
    evidence: TwinEvidenceItem[];
    ragConfidence: number;
    ragTopScore: number;
    graphEvidenceCount: number;
  }): TwinConfidenceResult {
    const verifiedCount = input.evidence.filter((e) => e.claimLevel === "VERIFIED")
      .length;
    const supportedCount = input.evidence.filter(
      (e) => e.claimLevel === "SUPPORTED" || e.claimLevel === "VERIFIED",
    ).length;

    let score =
      0.35 * input.ragConfidence +
      0.25 * Math.min(1, input.graphEvidenceCount / 5) +
      0.2 * Math.min(1, verifiedCount / 2) +
      0.1 * Math.min(1, supportedCount / 4) +
      0.1 * input.ragTopScore;

    if (input.evidence.length === 0) score = 0;
    if (verifiedCount >= 2 && supportedCount >= 3) score = Math.max(score, 0.78);

    const level = toLevel(score);
    const claimLevel = toClaimLevel(verifiedCount, supportedCount, score);

    return { score: Number(score.toFixed(4)), level, claimLevel };
  }
}

function toLevel(score: number): TwinConfidenceLevel {
  if (score >= 0.72) return "HIGH";
  if (score >= 0.45) return "MEDIUM";
  if (score >= 0.25) return "LOW";
  return "UNKNOWN";
}

function toClaimLevel(
  verified: number,
  supported: number,
  score: number,
): TwinClaimLevel {
  if (verified >= 1 && score >= 0.5) return "VERIFIED";
  if (supported >= 2 && score >= 0.4) return "SUPPORTED";
  if (score >= 0.25) return "INFERRED";
  return "UNKNOWN";
}
