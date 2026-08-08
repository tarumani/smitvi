import type {
  ExpertMatchBreakdown,
  InterpretedEntity,
  MatchEvidenceItem,
  RankedExpertResult,
} from "@/domain/search/types";
import type { GraphExpertCandidate } from "@/infrastructure/database/repositories/graph-search-repository";
import { profileHasDiscoverableHubCopy } from "@/domain/profile/qualified-public-hub";
import { prisma } from "@/infrastructure/database/prisma";

const WEIGHTS: Record<keyof ExpertMatchBreakdown, number> = {
  skillMatch: 0.26,
  industryMatch: 0.17,
  projectMatch: 0.13,
  technologyMatch: 0.09,
  experienceMatch: 0.07,
  knowledgeMatch: 0.09,
  semanticSimilarity: 0.06,
  evidenceStrength: 0.04,
  verificationScore: 0.02,
  profileCompleteness: 0.02,
  freshnessScore: 0.02,
  reputationBoost: 0.01,
  graphConnectivity: 0.02,
};

export function computeOverallMatch(breakdown: ExpertMatchBreakdown): number {
  let sum = 0;
  for (const key of Object.keys(WEIGHTS) as (keyof ExpertMatchBreakdown)[]) {
    sum += WEIGHTS[key] * clamp01(breakdown[key]);
  }
  return Math.round(clamp01(sum) * 100);
}

export function buildRankingExplanation(breakdown: ExpertMatchBreakdown): string {
  const parts = [
    `Skills ${pct(breakdown.skillMatch)}`,
    `Industry ${pct(breakdown.industryMatch)}`,
    `Projects ${pct(breakdown.projectMatch)}`,
    `Evidence ${pct(breakdown.evidenceStrength)}`,
  ];
  return `Ranked by graph match and evidence (${parts.join(", ")}). Popularity is capped.`;
}

export class ExpertRankingService {
  async rankExperts(input: {
    userIds: string[];
    interpretedEntities: InterpretedEntity[];
    graphCandidates: Map<string, GraphExpertCandidate>;
    semanticScores: Map<string, number>;
    keywordUserIds: Set<string>;
  }): Promise<RankedExpertResult[]> {
    if (input.userIds.length === 0) return [];

    const profiles = await prisma.profile.findMany({
      where: { userId: { in: input.userIds } },
      include: {
        skills: { include: { skill: true }, take: 8 },
        experiences: { take: 5 },
        portfolio: { take: 5 },
        user: {
          select: {
            knowledgeSources: {
              where: { isPublic: true, status: "READY" },
              select: { id: true, updatedAt: true },
              take: 5,
            },
          },
        },
      },
    });

    const requiredCount = input.interpretedEntities.filter(
      (e) => e.requirement === "REQUIRED",
    ).length;

    const results: RankedExpertResult[] = [];

    for (const profile of profiles) {
      if (!profileHasDiscoverableHubCopy(profile)) continue;

      const graph = input.graphCandidates.get(profile.userId);
      const semantic = input.semanticScores.get(profile.userId) ?? 0;

      const breakdown = scoreBreakdown(
        profile,
        input.interpretedEntities,
        graph,
        semantic,
        input.keywordUserIds.has(profile.userId),
        requiredCount,
      );

      const overallMatch = computeOverallMatch(breakdown);
      const { matched, unverified, evidence, why } = buildExplanations(
        profile,
        input.interpretedEntities,
        graph,
      );

      results.push({
        userId: profile.userId,
        username: profile.username,
        displayName: profile.displayName,
        headline: profile.headline,
        avatarUrl: profile.avatarUrl,
        profession: profile.profession,
        location: profile.location,
        reputationScore: profile.reputationScore,
        intelligencePoints: profile.intelligencePoints,
        ratingAverage: profile.ratingAverage,
        followersCount: profile.followersCount,
        overallMatch,
        breakdown,
        matchedCriteria: matched,
        unverifiedCriteria: unverified,
        topSkills: profile.skills.map((s) => s.skill.name).slice(0, 6),
        industries: input.interpretedEntities
          .filter((e) => e.type === "INDUSTRY")
          .map((e) => e.value),
        projects: profile.portfolio.map((p) => p.title).slice(0, 4),
        evidence,
        whyMatch: why,
      });
    }

    return results.sort((a, b) => b.overallMatch - a.overallMatch);
  }
}

function scoreBreakdown(
  profile: {
    skills: Array<{ skill: { name: string } }>;
    experiences: Array<{ company: string; title: string }>;
    portfolio: Array<{ title: string }>;
    profession: string | null;
    bio: string | null;
    headline: string | null;
    reputationScore: number;
    updatedAt: Date;
    user: { knowledgeSources: Array<{ updatedAt: Date }> };
  },
  entities: InterpretedEntity[],
  graph: GraphExpertCandidate | undefined,
  semantic: number,
  keywordHit: boolean,
  requiredCount: number,
): ExpertMatchBreakdown {
  const skillEntities = entities.filter(
    (e) => e.type === "SKILL" || e.type === "TOOL",
  );
  const industryEntities = entities.filter((e) => e.type === "INDUSTRY");
  const projectEntities = entities.filter((e) => e.type === "PROJECT");
  const techEntities = entities.filter((e) => e.type === "TECHNOLOGY");

  const profileSkillNames = profile.skills.map((s) =>
    s.skill.name.toLowerCase(),
  );

  const skillMatch = avgMatch(skillEntities, (e) =>
    profileSkillNames.some((n) => n.includes(e.value.toLowerCase())) ||
    graph?.matchedTypes.includes(e.type as never)
      ? 1
      : 0.2,
  );

  const industryMatch = avgMatch(industryEntities, (e) =>
    profile.experiences.some((ex) =>
      ex.company.toLowerCase().includes(e.value.toLowerCase()),
    ) || graph?.matchedTypes.includes("INDUSTRY")
      ? 0.9
      : 0.15,
  );

  const projectMatch = avgMatch(projectEntities, (e) =>
    profile.portfolio.some((p) =>
      p.title.toLowerCase().includes(e.value.toLowerCase().slice(0, 8)),
    ) || graph?.matchedTypes.includes("PROJECT")
      ? 0.88
      : 0.1,
  );

  const technologyMatch = avgMatch(techEntities, () =>
    graph?.matchedTypes.includes("TECHNOLOGY") ? 0.9 : 0.2,
  );

  const experienceMatch = clamp01(profile.experiences.length / 5);
  const knowledgeMatch = clamp01(
    profile.user.knowledgeSources.length / 3 + (keywordHit ? 0.2 : 0),
  );

  const evidenceStrength = graph?.matchedEntityIds.length
    ? clamp01(0.5 + graph.matchedEntityIds.length * 0.1)
    : 0.3;

  const verificationScore =
    requiredCount === 0 ? 0.5 : clamp01((graph?.matchedEntityIds.length ?? 0) / requiredCount);

  const profileCompleteness = clamp01(
    (profile.headline ? 0.3 : 0) +
      (profile.bio ? 0.3 : 0) +
      (profile.skills.length ? 0.2 : 0) +
      (profile.portfolio.length ? 0.2 : 0),
  );

  const latest =
    profile.user.knowledgeSources[0]?.updatedAt ?? profile.updatedAt;
  const days = (Date.now() - latest.getTime()) / (1000 * 60 * 60 * 24);
  const freshnessScore = clamp01(1 - days / 365);

  const reputationBoost = clamp01(Math.min(profile.reputationScore / 100, 0.5));

  const graphConnectivity = clamp01(
    (graph?.matchedEntityIds.length ?? 0) / Math.max(requiredCount, 1),
  );

  return {
    skillMatch,
    industryMatch,
    projectMatch,
    technologyMatch,
    experienceMatch,
    knowledgeMatch,
    semanticSimilarity: semantic,
    evidenceStrength,
    verificationScore,
    profileCompleteness,
    freshnessScore,
    reputationBoost,
    graphConnectivity,
  };
}

function buildExplanations(
  profile: {
    skills: Array<{ skill: { name: string } }>;
    portfolio: Array<{ title: string }>;
    experiences: Array<{ company: string }>;
  },
  entities: InterpretedEntity[],
  graph: GraphExpertCandidate | undefined,
): {
  matched: string[];
  unverified: string[];
  evidence: MatchEvidenceItem[];
  why: string[];
} {
  const matched: string[] = [];
  const unverified: string[] = [];
  const evidence: MatchEvidenceItem[] = [];
  const why: string[] = [];

  for (const ent of entities) {
    const inProfile =
      profile.skills.some((s) =>
        s.skill.name.toLowerCase().includes(ent.value.toLowerCase()),
      ) ||
      profile.portfolio.some((p) =>
        p.title.toLowerCase().includes(ent.value.toLowerCase().slice(0, 6)),
      );

    const graphHit = graph?.matchedTypes.includes(ent.type as never);

    if (inProfile || graphHit) {
      matched.push(ent.value);
      why.push(`✓ ${ent.value}`);
      evidence.push({
        label: ent.value,
        verified: ent.resolved || inProfile,
        sourceType: inProfile ? "PROFILE_FIELD" : "GRAPH",
        excerpt: inProfile ? "Profile or portfolio" : null,
      });
    } else if (ent.requirement === "REQUIRED") {
      unverified.push(`${ent.value} — not verified`);
    }
  }

  if (profile.experiences.length) {
    why.push(`✓ ${profile.experiences.length} experience entries`);
  }

  return { matched, unverified, evidence, why };
}

function avgMatch(
  entities: InterpretedEntity[],
  fn: (e: InterpretedEntity) => number,
): number {
  if (entities.length === 0) return 0.5;
  return clamp01(
    entities.reduce((acc, e) => acc + fn(e), 0) / entities.length,
  );
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

export { WEIGHTS };
