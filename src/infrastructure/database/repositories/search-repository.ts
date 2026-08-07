import { slugifySkill } from "@/domain/profile/value-objects";
import {
  profileHasDiscoverableHubCopy,
  qualifiedPublicHubProfileWhere,
  qualifiedPublicKnowledgeSourceWhere,
} from "@/domain/profile/qualified-public-hub";
import { cosineSimilarity } from "@/domain/knowledge/similarity";
import { embedTexts } from "@/infrastructure/ai/openai-client";
import { prisma } from "@/infrastructure/database/prisma";

export type SemanticSearchMatch = {
  chunkId: string;
  content: string;
  score: number;
  sourceTitle: string;
  ownerUsername: string;
  ownerDisplayName: string;
};

export type SearchResultGroup = {
  people: Array<{
    username: string;
    displayName: string;
    headline: string | null;
    avatarUrl: string | null;
    ratingAverage: number;
    followersCount: number;
  }>;
  skills: Array<{ name: string; slug: string; profileCount: number }>;
  topics: Array<{ topic: string; sourceCount: number }>;
  knowledge: Array<{
    id: string;
    title: string;
    summary: string | null;
    tags: string[];
    ownerUsername: string;
    ownerDisplayName: string;
  }>;
  questions: Array<{ question: string; sourceTitle: string; ownerUsername: string }>;
  semanticMatches: SemanticSearchMatch[];
};

/** Variants so "visual design" matches "visual-designing" / "Visual Designing". */
function searchVariants(query: string): string[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const slug = slugifySkill(trimmed);
  const spaced = slug.replace(/-/g, " ");
  const compact = trimmed.toLowerCase().replace(/[\s_-]+/g, "");

  return Array.from(
    new Set(
      [trimmed, slug, spaced, compact].filter((value) => value.length >= 2),
    ),
  );
}

const qualifiedPublicHubWhere = qualifiedPublicHubProfileWhere;

export class PrismaSearchRepository {
  async search(query: string, limit = 8): Promise<SearchResultGroup> {
    const q = query.trim();
    if (q.length < 2) {
      return emptyResults();
    }

    const variants = searchVariants(q);
    const like = `%${q}%`;
    const skillNameOr = variants.flatMap((variant) => [
      { name: { contains: variant, mode: "insensitive" as const } },
      { slug: { contains: variant, mode: "insensitive" as const } },
    ]);

    const [people, skills, knowledgeRows, topicRows, semanticMatches] =
      await Promise.all([
      prisma.profile.findMany({
        where: {
          AND: [
            qualifiedPublicHubProfileWhere,
            {
              OR: [
                { username: { contains: q, mode: "insensitive" } },
                { displayName: { contains: q, mode: "insensitive" } },
                { headline: { contains: q, mode: "insensitive" } },
                { bio: { contains: q, mode: "insensitive" } },
                {
                  skills: {
                    some: {
                      skill: {
                        OR: skillNameOr,
                      },
                    },
                  },
                },
              ],
            },
          ],
        },
        orderBy: [{ ratingAverage: "desc" }, { followersCount: "desc" }],
        take: limit * 4,
        select: {
          username: true,
          displayName: true,
          headline: true,
          bio: true,
          avatarUrl: true,
          ratingAverage: true,
          followersCount: true,
        },
      }),
      prisma.skill.findMany({
        where: {
          OR: skillNameOr,
        },
        take: limit,
        include: {
          _count: { select: { profiles: true } },
        },
      }),
      prisma.knowledgeSource.findMany({
        where: {
          AND: [
            qualifiedPublicKnowledgeSourceWhere,
            {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { summary: { contains: q, mode: "insensitive" } },
                { tags: { has: q } },
                { topics: { has: q } },
              ],
            },
          ],
        },
        take: limit * 3,
        orderBy: { updatedAt: "desc" },
        include: {
          user: {
            include: {
              profile: {
                select: {
                  username: true,
                  displayName: true,
                  visibility: true,
                  isOnboarded: true,
                  bio: true,
                  headline: true,
                },
              },
            },
          },
        },
      }),
      prisma.$queryRaw<Array<{ topic: string; source_count: bigint }>>`
        SELECT topic, COUNT(*)::bigint AS source_count
        FROM knowledge_sources ks
        INNER JOIN profiles p ON p.user_id = ks.user_id
        CROSS JOIN unnest(ks.topics) AS topic
        WHERE ks.is_public = true
          AND ks.status = 'READY'
          AND p.visibility = 'PUBLIC'
          AND p.is_onboarded = true
          AND (
            length(trim(coalesce(p.bio, ''))) > 0
            OR length(trim(coalesce(p.headline, ''))) > 0
          )
          AND topic ILIKE ${like}
        GROUP BY topic
        ORDER BY source_count DESC
        LIMIT ${limit}
      `,
      this.searchSemanticPublic(q, limit).catch(() => [] as SemanticSearchMatch[]),
    ]);

    const questions = knowledgeRows
      .flatMap((source) => {
        const profile = source.user.profile;
        if (!profile?.username || !profileHasDiscoverableHubCopy(profile)) {
          return [];
        }
        if (!Array.isArray(source.faqs)) return [];
        return source.faqs
          .map((faq) => {
            if (
              typeof faq === "object" &&
              faq !== null &&
              "question" in faq &&
              typeof faq.question === "string" &&
              faq.question.toLowerCase().includes(q.toLowerCase())
            ) {
              return {
                question: faq.question,
                sourceTitle: source.title,
                ownerUsername: profile.username,
              };
            }
            return null;
          })
          .filter((item): item is NonNullable<typeof item> => item !== null);
      })
      .slice(0, limit);

    return {
      people: people
        .filter((person) => profileHasDiscoverableHubCopy(person))
        .slice(0, limit)
        .map(({ bio: _bio, ...person }) => ({
          username: person.username,
          displayName: person.displayName,
          headline: person.headline,
          avatarUrl: person.avatarUrl,
          ratingAverage: person.ratingAverage,
          followersCount: person.followersCount,
        })),
      skills: skills.map((skill) => ({
        name: skill.name,
        slug: skill.slug,
        profileCount: skill._count.profiles,
      })),
      topics: topicRows.map((row) => ({
        topic: row.topic,
        sourceCount: Number(row.source_count),
      })),
      knowledge: knowledgeRows
        .filter(
          (source) =>
            source.user.profile &&
            profileHasDiscoverableHubCopy(source.user.profile),
        )
        .slice(0, limit)
        .map((source) => ({
          id: source.id,
          title: source.title,
          summary: source.summary,
          tags: source.tags,
          ownerUsername: source.user.profile!.username,
          ownerDisplayName: source.user.profile!.displayName,
        })),
      questions,
      semanticMatches,
    };
  }

  async searchSemanticPublic(
    query: string,
    limit = 8,
  ): Promise<SemanticSearchMatch[]> {
    const q = query.trim();
    if (q.length < 2) return [];

    try {
      const [queryEmbedding] = await embedTexts([q]);
      if (!queryEmbedding?.length) return [];

      return await this.loadSemanticMatches(queryEmbedding, limit);
    } catch {
      return [];
    }
  }

  private async loadSemanticMatches(
    queryEmbedding: number[],
    limit: number,
  ): Promise<SemanticSearchMatch[]> {
    const chunks = await prisma.knowledgeChunk.findMany({
      where: {
        source: qualifiedPublicKnowledgeSourceWhere,
      },
      include: {
        source: {
          include: {
            user: {
              include: {
                profile: {
                  select: {
                    username: true,
                    displayName: true,
                    bio: true,
                    headline: true,
                  },
                },
              },
            },
          },
        },
      },
      take: 1500,
    });

    return chunks
      .map((chunk) => ({
        chunkId: chunk.id,
        content: chunk.content,
        score: cosineSimilarity(queryEmbedding, chunk.embedding),
        sourceTitle: chunk.source.title,
        ownerUsername: chunk.source.user.profile?.username ?? "",
        ownerDisplayName: chunk.source.user.profile?.displayName ?? "",
        profile: chunk.source.user.profile,
      }))
      .filter(
        (row) =>
          row.score >= 0.72 &&
          row.ownerUsername.length > 0 &&
          row.profile &&
          profileHasDiscoverableHubCopy(row.profile),
      )
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ profile: _profile, ...row }) => row);
  }

  async countQualifiedPublicHubs(): Promise<number> {
    const rows = await prisma.profile.findMany({
      where: qualifiedPublicHubProfileWhere,
      select: { bio: true, headline: true },
    });
    return rows.filter((row) => profileHasDiscoverableHubCopy(row)).length;
  }

  async trendingExperts(limit = 8) {
    const poolSize = Math.max(limit * 5, 40);
    const rows = await prisma.profile.findMany({
      where: qualifiedPublicHubWhere,
      orderBy: [{ followersCount: "desc" }, { ratingAverage: "desc" }],
      take: poolSize,
      select: {
        username: true,
        displayName: true,
        headline: true,
        bio: true,
        avatarUrl: true,
        followersCount: true,
        ratingAverage: true,
      },
    });

    return rows
      .filter((profile) => profileHasDiscoverableHubCopy(profile))
      .slice(0, limit)
      .map(({ bio: _bio, ratingAverage: _rating, ...expert }) => expert);
  }

  async newExperts(limit = 8) {
    const poolSize = Math.max(limit * 5, 40);
    const rows = await prisma.profile.findMany({
      where: qualifiedPublicHubWhere,
      orderBy: { createdAt: "desc" },
      take: poolSize,
      select: {
        username: true,
        displayName: true,
        headline: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    return rows
      .filter((profile) => profileHasDiscoverableHubCopy(profile))
      .slice(0, limit)
      .map(({ bio: _bio, createdAt, ...expert }) => ({
        ...expert,
        createdAt,
      }));
  }

  async trendingTopics(limit = 10) {
    const rows = await prisma.$queryRaw<
      Array<{ topic: string; source_count: bigint }>
    >`
      SELECT topic, COUNT(*)::bigint AS source_count
      FROM knowledge_sources ks
      INNER JOIN profiles p ON p.user_id = ks.user_id
      CROSS JOIN unnest(ks.topics) AS topic
      WHERE ks.is_public = true
        AND ks.status = 'READY'
        AND p.visibility = 'PUBLIC'
        AND p.is_onboarded = true
        AND (
          length(trim(coalesce(p.bio, ''))) > 0
          OR length(trim(coalesce(p.headline, ''))) > 0
        )
      GROUP BY topic
      ORDER BY source_count DESC
      LIMIT ${limit}
    `;
    return rows.map((row) => ({
      topic: row.topic,
      sourceCount: Number(row.source_count),
    }));
  }

  async latestPublicKnowledge(limit = 8) {
    const rows = await prisma.knowledgeSource.findMany({
      where: qualifiedPublicKnowledgeSourceWhere,
      orderBy: { updatedAt: "desc" },
      take: limit * 4,
      include: {
        user: {
          include: {
            profile: {
              select: {
                username: true,
                displayName: true,
                visibility: true,
                isOnboarded: true,
                bio: true,
                headline: true,
              },
            },
          },
        },
      },
    });

    return rows
      .filter(
        (row) =>
          row.user.profile &&
          profileHasDiscoverableHubCopy(row.user.profile),
      )
      .slice(0, limit)
      .map((row) => ({
        id: row.id,
        title: row.title,
        summary: row.summary,
        topics: row.topics,
        tags: row.tags,
        ownerUsername: row.user.profile!.username,
        ownerDisplayName: row.user.profile!.displayName,
      }));
  }

  async networkOpenQuestions(limit = 8) {
    const sources = await prisma.knowledgeSource.findMany({
      where: qualifiedPublicKnowledgeSourceWhere,
      orderBy: { updatedAt: "desc" },
      take: 60,
      include: {
        user: {
          include: {
            profile: {
              select: {
                username: true,
                displayName: true,
                visibility: true,
                isOnboarded: true,
                bio: true,
                headline: true,
              },
            },
          },
        },
      },
    });

    const questions: Array<{
      question: string;
      topic: string;
      ownerUsername: string;
      ownerDisplayName: string;
    }> = [];

    for (const source of sources) {
      const profile = source.user.profile;
      if (!profile || !profileHasDiscoverableHubCopy(profile)) continue;
      if (!Array.isArray(source.faqs)) continue;
      const topic =
        source.topics[0] ?? source.tags[0] ?? "Expertise";
      for (const faq of source.faqs) {
        if (
          typeof faq === "object" &&
          faq !== null &&
          "question" in faq &&
          typeof faq.question === "string" &&
          faq.question.trim().length > 8
        ) {
          questions.push({
            question: faq.question.trim(),
            topic,
            ownerUsername: profile.username,
            ownerDisplayName: profile.displayName,
          });
        }
        if (questions.length >= limit) break;
      }
      if (questions.length >= limit) break;
    }

    return questions.slice(0, limit);
  }
}

function emptyResults(): SearchResultGroup {
  return {
    people: [],
    skills: [],
    topics: [],
    knowledge: [],
    questions: [],
    semanticMatches: [],
  };
}
