import type { IntelligenceActionType } from "@/generated/prisma/client";
import type { ProfileType } from "@/generated/prisma/client";

export type NextBestActionCandidate = {
  type: IntelligenceActionType;
  title: string;
  description: string;
  estimatedMinutes: number;
  expectedImpact: {
    intelligenceReadiness: number;
    graphConnections: number;
  };
  href: string;
  cta: string;
  priority?: number;
  scores: {
    incompleteness: number;
    highImpact: number;
    relevance: number;
    recentBehavior: number;
    graphImprovement: number;
    recentlyShown: number;
    previouslyDismissed: number;
    notRelevant: number;
  };
};

export type ActionContext = {
  profileType: ProfileType | null;
  activationStatus: string;
  readinessScore: number;
  missing: string[];
  skillCount: number;
  experienceCount: number;
  projectCount: number;
  knowledgeCount: number;
  graphCount: number;
  twinQueryCount30d: number;
  followCount: number;
  marketplaceListingCount: number;
  consultationEnabled: boolean;
  appearInDiscovery: boolean;
  opportunityCount: number;
  recommendationCount: number;
  weekStartReadiness: number | null;
  shownTypesLast3Days: IntelligenceActionType[];
  dismissedTypesLast14Days: IntelligenceActionType[];
  completedTypesLast7Days: IntelligenceActionType[];
};

export function scoreCandidate(candidate: NextBestActionCandidate): number {
  const s = candidate.scores;
  return Math.max(
    0,
    s.incompleteness +
      s.highImpact +
      s.relevance +
      s.recentBehavior +
      s.graphImprovement +
      s.recentlyShown +
      s.previouslyDismissed +
      s.notRelevant,
  );
}

function base(
  type: IntelligenceActionType,
  title: string,
  description: string,
  extra: Omit<Partial<NextBestActionCandidate>, "scores"> & {
    scores?: Partial<NextBestActionCandidate["scores"]>;
  },
): NextBestActionCandidate {
  return {
    type,
    title,
    description,
    estimatedMinutes: extra.estimatedMinutes ?? 2,
    expectedImpact: extra.expectedImpact ?? {
      intelligenceReadiness: 0,
      graphConnections: 0,
    },
    href: extra.href ?? "/hub/today",
    cta: extra.cta ?? "Continue",
    scores: {
      incompleteness: 0,
      highImpact: 0,
      relevance: 20,
      recentBehavior: 0,
      graphImprovement: 0,
      recentlyShown: 0,
      previouslyDismissed: 0,
      notRelevant: 0,
      ...(extra.scores ?? {}),
    },
  };
}

export function buildActionCandidates(
  ctx: ActionContext,
): NextBestActionCandidate[] {
  const student = ctx.profileType === "STUDENT";
  const creator = ctx.profileType === "CREATOR";
  const founder = ctx.profileType === "FOUNDER";
  const incomplete = ctx.readinessScore < 61;
  const candidates: NextBestActionCandidate[] = [];

  const shown = new Set(ctx.shownTypesLast3Days);
  const dismissed = new Set(ctx.dismissedTypesLast14Days);
  const completed = new Set(ctx.completedTypesLast7Days);

  const penalties = (type: IntelligenceActionType) => ({
    recentlyShown: shown.has(type) ? -30 : 0,
    previouslyDismissed: dismissed.has(type) ? -20 : 0,
  });

  if (!ctx.activationStatus.includes("ACTIVATED") && ctx.missing.length) {
    candidates.push(
      base("COMPLETE_PROFILE", "Finish your Intelligence Profile", "A few confirmed details unlock discovery and your AI Twin.", {
        href: "/onboarding/intelligence",
        cta: "Continue profile",
        expectedImpact: { intelligenceReadiness: 15, graphConnections: 3 },
        scores: {
          incompleteness: 30,
          highImpact: 25,
          relevance: 20,
          graphImprovement: 10,
          ...penalties("COMPLETE_PROFILE"),
        },
      }),
    );
  }

  if (ctx.skillCount < 3) {
    candidates.push(
      base("ADD_SKILL", "Confirm three skills", "Skills help people and search understand what you know.", {
        href: "/settings/profile",
        cta: "Add skills",
        expectedImpact: { intelligenceReadiness: 15, graphConnections: 3 },
        scores: {
          incompleteness: 30,
          highImpact: 25,
          relevance: 20,
          graphImprovement: 10,
          ...penalties("ADD_SKILL"),
        },
      }),
    );
  }

  if (ctx.projectCount === 0) {
    candidates.push(
      base("ADD_PROJECT", "Add a project to your Intelligence Profile", "Projects help people understand how you apply your skills.", {
        href: "/hub/today?update=1",
        cta: "Add with AI",
        estimatedMinutes: 2,
        expectedImpact: { intelligenceReadiness: 15, graphConnections: 4 },
        scores: {
          incompleteness: incomplete ? 30 : 10,
          highImpact: 25,
          relevance: 20,
          graphImprovement: 10,
          ...penalties("ADD_PROJECT"),
        },
      }),
    );
  }

  if (ctx.experienceCount === 0 && ctx.profileType !== "STUDENT") {
    candidates.push(
      base("ADD_EXPERIENCE", "Add one experience record", "Experience grounds your graph in real work.", {
        href: "/settings/profile",
        cta: "Add experience",
        expectedImpact: { intelligenceReadiness: 15, graphConnections: 2 },
        scores: {
          incompleteness: 20,
          highImpact: 15,
          relevance: student ? 0 : 20,
          notRelevant: student ? -50 : 0,
          graphImprovement: 10,
          ...penalties("ADD_EXPERIENCE"),
        },
      }),
    );
  }

  if (ctx.knowledgeCount === 0) {
    candidates.push(
      base("ADD_KNOWLEDGE", "Share knowledge to improve your AI Twin", "One source makes your Twin more useful to visitors.", {
        href: "/hub/intelligence",
        cta: "Add knowledge",
        estimatedMinutes: 5,
        expectedImpact: { intelligenceReadiness: 15, graphConnections: 5 },
        scores: {
          incompleteness: incomplete ? 25 : 10,
          highImpact: 25,
          relevance: 20,
          graphImprovement: 10,
          ...penalties("ADD_KNOWLEDGE"),
        },
      }),
    );
  }

  candidates.push(
    base("UPDATE_INTELLIGENCE", "Share a one-minute intelligence update", "Tell us what you worked on or learned recently.", {
      href: "/hub/today?update=1",
      cta: "Update my intelligence",
      estimatedMinutes: 1,
      expectedImpact: { intelligenceReadiness: 8, graphConnections: 3 },
      scores: {
        incompleteness: 5,
        highImpact: 15,
        relevance: 20,
        recentBehavior: ctx.twinQueryCount30d > 0 ? 15 : 5,
        graphImprovement: 10,
        ...penalties("UPDATE_INTELLIGENCE"),
      },
    }),
  );

  if (ctx.knowledgeCount > 0 && ctx.twinQueryCount30d < 3) {
    candidates.push(
      base("IMPROVE_TWIN", "Teach your AI Twin something important", "Add structured context so answers stay accurate.", {
        href: "/hub/today?teach=1",
        cta: "Teach my Twin",
        estimatedMinutes: 2,
        expectedImpact: { intelligenceReadiness: 5, graphConnections: 3 },
        scores: {
          incompleteness: 5,
          highImpact: 20,
          relevance: 20,
          recentBehavior: 10,
          graphImprovement: 10,
          ...penalties("IMPROVE_TWIN"),
        },
      }),
    );
  }

  if (ctx.followCount < 3 && ctx.recommendationCount > 0) {
    candidates.push(
      base("CONNECT_EXPERT", "Connect with someone complementary", "A relevant connection improves discovery and collaboration.", {
        href: "/discover",
        cta: "View people",
        scores: {
          incompleteness: 0,
          highImpact: 10,
          relevance: 20,
          recentBehavior: 5,
          graphImprovement: 5,
          ...penalties("CONNECT_EXPERT"),
        },
      }),
    );
  }

  if (ctx.recommendationCount > 0) {
    candidates.push(
      base("REVIEW_RECOMMENDATION", "Review a recommendation for you", "Confirm what is relevant so future matches improve.", {
        href: "/hub/dashboard",
        cta: "Review",
        scores: {
          incompleteness: 0,
          highImpact: 5,
          relevance: 15,
          recentBehavior: 10,
          ...penalties("REVIEW_RECOMMENDATION"),
        },
      }),
    );
  }

  if (ctx.opportunityCount > 0) {
    candidates.push(
      base("RESPOND_TO_OPPORTUNITY", "Your expertise matches a live opportunity", "A marketplace listing aligns with your graph skills.", {
        href: "/marketplace",
        cta: "View",
        scores: {
          incompleteness: 0,
          highImpact: 20,
          relevance: 20,
          recentBehavior: 10,
          notRelevant: 0,
          ...penalties("RESPOND_TO_OPPORTUNITY"),
        },
      }),
    );
  }

  if (!ctx.appearInDiscovery && ctx.readinessScore >= 41) {
    candidates.push(
      base("ACTIVATE_DISCOVERY", "Appear in Expert Discovery", "Your profile has enough structure to be found — enable discovery when you are ready.", {
        href: "/settings/profile",
        cta: "Review visibility",
        scores: {
          incompleteness: 10,
          highImpact: 20,
          relevance: 20,
          ...penalties("ACTIVATE_DISCOVERY"),
        },
      }),
    );
  }

  const monetizationReady = ctx.readinessScore >= 81;
  if (monetizationReady && !ctx.consultationEnabled && !student) {
    candidates.push(
      base("CREATE_CONSULTATION", "Enable consultation booking", "Your expertise is discoverable — offer time when you are ready.", {
        href: "/settings/consultations",
        cta: "Enable consultation",
        estimatedMinutes: 5,
        scores: {
          incompleteness: 0,
          highImpact: 15,
          relevance: 20,
          notRelevant: student ? -50 : 0,
          ...penalties("CREATE_CONSULTATION"),
        },
      }),
    );
  }

  if (creator && ctx.knowledgeCount >= 3 && ctx.marketplaceListingCount === 0) {
    candidates.push(
      base("CREATE_GUIDE", "Turn your best knowledge into a paid guide", "You have published knowledge that could become a listing.", {
        href: "/marketplace/sell",
        cta: "Create guide",
        estimatedMinutes: 10,
        scores: {
          incompleteness: 0,
          highImpact: 15,
          relevance: 25,
          ...penalties("CREATE_GUIDE"),
        },
      }),
    );
  }

  if (founder && ctx.marketplaceListingCount === 0) {
    candidates.push(
      base("CREATE_PRODUCT", "Create an organization or product listing", "Business profiles can publish verified offerings when ready.", {
        href: "/orgs/new",
        cta: "Create organization",
        scores: {
          incompleteness: 0,
          highImpact: 10,
          relevance: 20,
          ...penalties("CREATE_PRODUCT"),
        },
      }),
    );
  }

  return candidates
    .filter((c) => !completed.has(c.type) || c.type === "UPDATE_INTELLIGENCE")
    .map((c) => ({ ...c, priority: scoreCandidate(c) }))
    .sort((a, b) => scoreCandidate(b) - scoreCandidate(a));
}

export function pickDailyChallenge(
  weekday: number,
  ranked: NextBestActionCandidate[],
): NextBestActionCandidate | null {
  const preferred: IntelligenceActionType[][] = [
    ["ADD_PROJECT", "UPDATE_INTELLIGENCE"],
    ["UPDATE_INTELLIGENCE", "ADD_KNOWLEDGE"],
    ["CONNECT_EXPERT", "REVIEW_RECOMMENDATION"],
    ["IMPROVE_TWIN", "ADD_KNOWLEDGE"],
    ["REVIEW_WEEKLY_REPORT", "UPDATE_INTELLIGENCE"],
    ["ADD_PROJECT", "ADD_SKILL"],
    ["UPDATE_INTELLIGENCE", "EXPLORE_TOPIC"],
  ];
  const dayPrefs = preferred[weekday] ?? preferred[0];
  for (const type of dayPrefs) {
    const match = ranked.find((c) => c.type === type && c.scores.notRelevant > -50);
    if (match) return match;
  }
  return ranked[0] ?? null;
}
