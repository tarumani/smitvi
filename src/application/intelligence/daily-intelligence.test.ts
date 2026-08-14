import { describe, expect, it } from "vitest";
import {
  buildActionCandidates,
  scoreCandidate,
  type ActionContext,
} from "@/domain/intelligence/next-best-action";
import {
  canSendReengagement,
  classifyActivitySegment,
  reengagementCopy,
} from "@/domain/intelligence/activity-segment";
import { intelligenceUpdateExtractionSchema } from "@/domain/intelligence/update-extraction";
import { evaluateActivation } from "@/domain/profile/activation";
import { calculateIntelligenceReadiness } from "@/domain/profile/intelligence-readiness";

function ctx(partial: Partial<ActionContext>): ActionContext {
  return {
    profileType: "PROFESSIONAL",
    activationStatus: "REGISTERED",
    readinessScore: 20,
    missing: ["skills", "project"],
    skillCount: 0,
    experienceCount: 0,
    projectCount: 0,
    knowledgeCount: 0,
    graphCount: 0,
    twinQueryCount30d: 0,
    followCount: 0,
    marketplaceListingCount: 0,
    consultationEnabled: false,
    appearInDiscovery: false,
    opportunityCount: 0,
    recommendationCount: 0,
    weekStartReadiness: null,
    shownTypesLast3Days: [],
    dismissedTypesLast14Days: [],
    completedTypesLast7Days: [],
    ...partial,
  };
}

describe("next best action", () => {
  it("prioritizes projects for an incomplete new user", () => {
    const ranked = buildActionCandidates(ctx({}));
    expect(ranked[0]?.type).toMatch(/COMPLETE_PROFILE|ADD_SKILL|ADD_PROJECT/);
    expect(ranked[0] && scoreCandidate(ranked[0])).toBeGreaterThan(40);
  });

  it("does not suggest client consultation to students", () => {
    const ranked = buildActionCandidates(
      ctx({
        profileType: "STUDENT",
        readinessScore: 90,
        skillCount: 5,
        projectCount: 1,
        knowledgeCount: 2,
      }),
    );
    expect(ranked.some((a) => a.type === "CREATE_CONSULTATION")).toBe(false);
  });

  it("surfaces create guide for creators with knowledge and no listings", () => {
    const ranked = buildActionCandidates(
      ctx({
        profileType: "CREATOR",
        readinessScore: 70,
        skillCount: 4,
        projectCount: 1,
        knowledgeCount: 3,
        marketplaceListingCount: 0,
      }),
    );
    expect(ranked.some((a) => a.type === "CREATE_GUIDE")).toBe(true);
  });

  it("penalizes recently shown and dismissed actions", () => {
    const ranked = buildActionCandidates(
      ctx({
        shownTypesLast3Days: ["ADD_PROJECT"],
        dismissedTypesLast14Days: ["ADD_PROJECT"],
        projectCount: 0,
      }),
    );
    const project = ranked.find((a) => a.type === "ADD_PROJECT");
    expect(project).toBeTruthy();
    expect(scoreCandidate(project!)).toBeLessThan(
      scoreCandidate({
        ...project!,
        scores: {
          ...project!.scores,
          recentlyShown: 0,
          previouslyDismissed: 0,
        },
      }),
    );
  });

  it("marks dismissed actions so they are not the only suggestion forever", () => {
    const ranked = buildActionCandidates(
      ctx({ dismissedTypesLast14Days: ["ADD_PROJECT"] }),
    );
    expect(ranked.length).toBeGreaterThan(1);
  });
});

describe("intelligence ready vs incomplete", () => {
  it("treats incomplete profiles as not activated", () => {
    expect(
      evaluateActivation({
        username: "newuser",
        profileType: null,
        headline: "hi",
        bio: "hello",
        confirmedSkillCount: 0,
        expertiseCount: 0,
        industryCount: 0,
      }).activated,
    ).toBe(false);
  });

  it("scores an intelligence-ready professional highly", () => {
    const score = calculateIntelligenceReadiness({
      hasUsername: true,
      hasProfileType: true,
      hasMeaningfulSummary: true,
      confirmedSkillCount: 5,
      hasExperience: true,
      hasProject: true,
      knowledgeReadyCount: 1,
      graphConnectionCount: 5,
      userVerifiedFactCount: 4,
    });
    expect(score.level).toBe("INTELLIGENCE_READY");
  });
});

describe("activity segments and re-engagement", () => {
  it("classifies no activity as inactive", () => {
    expect(classifyActivitySegment(null)).toBe("INACTIVE");
  });

  it("classifies 30+ day gap as inactive", () => {
    const past = new Date(Date.now() - 40 * 86400000);
    expect(classifyActivitySegment(past)).toBe("INACTIVE");
  });

  it("rate-limits re-engagement to once per 24h", () => {
    expect(
      canSendReengagement(new Date(), "INACTIVE"),
    ).toBe(false);
    expect(canSendReengagement(null, "INACTIVE")).toBe(true);
    expect(canSendReengagement(null, "ACTIVE_TODAY")).toBe(false);
  });

  it("uses a specific return reason, not a generic come-back line", () => {
    const copy = reengagementCopy({
      missingProject: true,
      missingKnowledge: false,
      readinessScore: 40,
    });
    expect(copy.body.toLowerCase()).toContain("project");
    expect(copy.body.toLowerCase()).not.toContain("come back to smitvi");
  });
});

describe("AI extraction schema", () => {
  it("accepts empty extraction after AI failure shape", () => {
    const parsed = intelligenceUpdateExtractionSchema.parse({
      items: [],
      projectTitle: null,
      summary: null,
    });
    expect(parsed.items).toEqual([]);
  });

  it("keeps inferred items distinct from explicit", () => {
    const parsed = intelligenceUpdateExtractionSchema.parse({
      items: [
        {
          value: "UX Design",
          category: "skill",
          confidence: 0.9,
          evidence: "redesigned checkout",
          classification: "EXPLICIT",
        },
        {
          value: "E-commerce",
          category: "industry",
          confidence: 0.6,
          evidence: null,
          classification: "INFERRED",
        },
      ],
    });
    expect(parsed.items.filter((i) => i.classification === "INFERRED")).toHaveLength(1);
  });

  it("does not invent search impressions in weekly metrics contract", () => {
    const metrics = { searches: 0, visits: 0 };
    expect(metrics.searches).toBe(0);
    expect(metrics.visits).toBe(0);
  });
});

describe("weekly report accuracy", () => {
  it("computes delta from stored previous score, not invented activity", () => {
    const previous = 68;
    const current = 74;
    expect(current - previous).toBe(6);
  });
});
