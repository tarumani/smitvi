import { describe, expect, it } from "vitest";
import {
  computeCreatorPotential,
  computeMonetizationPotential,
  computeOverallGrowthScore,
  inferMonetizationPaths,
} from "@/application/growth/growth-scoring-service";
import {
  normalizeEmail,
  normalizeProspectUrl,
} from "@/application/growth/growth-suppression-service";
import { dedupeKey as prospectDedupeKey } from "@/application/growth/growth-prospect-service";
import { PortfolioAuditService } from "@/application/growth/portfolio-audit-service";
import { GrowthValuePropositionService } from "@/application/growth/growth-value-proposition-service";
import { DEFAULT_GROWTH_WEIGHTS } from "@/domain/growth/types";

describe("growth deduplication", () => {
  it("normalizes email", () => {
    expect(normalizeEmail("  Test@Example.com ")).toBe("test@example.com");
  });

  it("builds dedupe key from email first", () => {
    expect(
      prospectDedupeKey({
        email: "a@b.com",
        portfolioUrl: "https://x.com",
      }),
    ).toBe("a@b.com");
  });

  it("strips trailing slash on urls", () => {
    const a = normalizeProspectUrl("https://example.com/portfolio/");
    const b = normalizeProspectUrl("https://example.com/portfolio");
    expect(a).toBe(b);
  });
});

describe("growth scoring", () => {
  it("boosts creator score with portfolio", () => {
    const withPortfolio = computeCreatorPotential({
      skills: ["Figma", "UX", "Research"],
      topics: [],
      portfolioUrl: "https://portfolio.example",
    });
    const without = computeCreatorPotential({
      skills: ["Figma", "UX", "Research"],
      topics: [],
    });
    expect(withPortfolio).toBeGreaterThan(without);
  });

  it("computes overall from breakdown", () => {
    const score = computeOverallGrowthScore(
      {
        demandMatch: 80,
        creatorSignals: 70,
        monetization: 75,
        networkGap: 90,
        lookalike: 50,
        referral: 0,
      },
      DEFAULT_GROWTH_WEIGHTS,
    );
    expect(score).toBeGreaterThan(60);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("suggests monetization paths for designers", () => {
    const paths = inferMonetizationPaths({
      skills: ["Figma", "Healthcare UX"],
      topics: [],
      profession: "UX Designer",
    });
    expect(paths.some((p) => /consult/i.test(p) || /template/i.test(p))).toBe(
      true,
    );
  });
});

describe("value proposition", () => {
  it("uses designer message when portfolio present", () => {
    const vp = new GrowthValuePropositionService().build({
      name: "Alex Chen",
      profession: "UI Designer",
      skills: ["Figma"],
      portfolioUrl: "https://example.com/work",
    });
    expect(vp.archetype).toBe("designer");
    expect(vp.headline.toLowerCase()).toContain("portfolio");
  });
});

describe("portfolio audit funnel", () => {
  it("never claims facts without input", () => {
    const audit = new PortfolioAuditService().auditFromUrl("https://figma.com/file/x", {});
    expect(audit.disclaimer.toLowerCase()).toContain("does not");
    expect(audit.skills.length).toBeGreaterThan(0);
  });

  it("marks unknown profession when missing", () => {
    const audit = new PortfolioAuditService().auditFromUrl("https://example.com", {});
    expect(audit.experienceSignals.some((s) => s.includes("UNKNOWN"))).toBe(true);
  });
});

describe("suppression key helper", () => {
  it("prospect dedupe uses normalized email", () => {
    expect(prospectDedupeKey({ email: "  X@Y.com " })).toBe("x@y.com");
  });
});
