import { describe, expect, it } from "vitest";
import {
  detectIntent,
  normalizeQuery,
} from "@/application/search/query-understanding";
import {
  computeOverallMatch,
  WEIGHTS,
} from "@/application/search/expert-ranking-service";

describe("normalizeQuery", () => {
  it("strips filler words context", () => {
    expect(normalizeQuery("  Find a UX designer  ")).toContain("ux designer");
  });
});

describe("detectIntent", () => {
  it("detects mentor intent", () => {
    expect(detectIntent("who can mentor me in ux research")).toBe(
      "MENTOR_DISCOVERY",
    );
  });

  it("detects expert discovery for designer queries", () => {
    expect(detectIntent("healthcare ux designer with figma")).toBe(
      "EXPERT_DISCOVERY",
    );
  });
});

describe("computeOverallMatch", () => {
  it("weights skill match heavily", () => {
    const high = computeOverallMatch({
      skillMatch: 1,
      industryMatch: 1,
      projectMatch: 0.9,
      technologyMatch: 0.9,
      experienceMatch: 0.8,
      knowledgeMatch: 0.7,
      semanticSimilarity: 0.7,
      evidenceStrength: 0.9,
      verificationScore: 1,
      profileCompleteness: 0.8,
      freshnessScore: 0.5,
      reputationBoost: 0.2,
      graphConnectivity: 0.9,
    });
    const low = computeOverallMatch({
      skillMatch: 0.2,
      industryMatch: 0.2,
      projectMatch: 0.2,
      technologyMatch: 0.2,
      experienceMatch: 0.2,
      knowledgeMatch: 0.2,
      semanticSimilarity: 0.2,
      evidenceStrength: 0.2,
      verificationScore: 0.2,
      profileCompleteness: 0.2,
      freshnessScore: 0.2,
      reputationBoost: 0.5,
      graphConnectivity: 0.2,
    });
    expect(high).toBeGreaterThan(low);
    expect(high).toBeGreaterThan(80);
  });

  it("uses documented weights sum", () => {
    const sum = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 2);
  });
});
