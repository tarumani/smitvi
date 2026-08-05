import { slugifySkill } from "@/domain/profile/value-objects";
import { prisma } from "@/infrastructure/database/prisma";

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

    const [people, skills, knowledgeRows, topicRows] = await Promise.all([
      prisma.profile.findMany({
        where: {
          visibility: "PUBLIC",
          isOnboarded: true,
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
        orderBy: [{ ratingAverage: "desc" }, { followersCount: "desc" }],
        take: limit,
        select: {
          username: true,
          displayName: true,
          headline: true,
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
          isPublic: true,
          status: "READY",
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { summary: { contains: q, mode: "insensitive" } },
            { tags: { has: q } },
            { topics: { has: q } },
          ],
        },
        take: limit,
        orderBy: { updatedAt: "desc" },
        include: {
          user: {
            include: {
              profile: {
                select: { username: true, displayName: true, visibility: true },
              },
            },
          },
        },
      }),
      prisma.$queryRaw<Array<{ topic: string; source_count: bigint }>>`
        SELECT topic, COUNT(*)::bigint AS source_count
        FROM knowledge_sources, unnest(topics) AS topic
        WHERE is_public = true
          AND status = 'READY'
          AND topic ILIKE ${like}
        GROUP BY topic
        ORDER BY source_count DESC
        LIMIT ${limit}
      `,
    ]);

    const questions = knowledgeRows
      .flatMap((source) => {
        const username = source.user.profile?.username;
        if (!username || source.user.profile?.visibility !== "PUBLIC") return [];
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
                ownerUsername: username,
              };
            }
            return null;
          })
          .filter((item): item is NonNullable<typeof item> => item !== null);
      })
      .slice(0, limit);

    return {
      people: people.map((person) => ({
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
            source.user.profile?.visibility === "PUBLIC" &&
            source.user.profile.username,
        )
        .map((source) => ({
          id: source.id,
          title: source.title,
          summary: source.summary,
          tags: source.tags,
          ownerUsername: source.user.profile!.username,
          ownerDisplayName: source.user.profile!.displayName,
        })),
      questions,
    };
  }

  async trendingExperts(limit = 8) {
    const poolSize = Math.max(limit * 5, 40);
    const rows = await prisma.profile.findMany({
      where: {
        visibility: "PUBLIC",
        isOnboarded: true,
        user: {
          knowledgeSources: {
            some: { isPublic: true, status: "READY" },
          },
        },
      },
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
      .filter((profile) => profileHasPublicHubDescription(profile))
      .slice(0, limit)
      .map(({ bio: _bio, ratingAverage: _rating, ...expert }) => expert);
  }

  async newExperts(limit = 8) {
    return prisma.profile.findMany({
      where: { visibility: "PUBLIC", isOnboarded: true },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        username: true,
        displayName: true,
        headline: true,
        avatarUrl: true,
        createdAt: true,
      },
    });
  }

  async trendingTopics(limit = 10) {
    const rows = await prisma.$queryRaw<
      Array<{ topic: string; source_count: bigint }>
    >`
      SELECT topic, COUNT(*)::bigint AS source_count
      FROM knowledge_sources, unnest(topics) AS topic
      WHERE is_public = true AND status = 'READY'
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
      where: { isPublic: true, status: "READY" },
      orderBy: { updatedAt: "desc" },
      take: limit,
      include: {
        user: {
          include: {
            profile: {
              select: {
                username: true,
                displayName: true,
                visibility: true,
                isOnboarded: true,
              },
            },
          },
        },
      },
    });

    return rows
      .filter(
        (row) =>
          row.user.profile?.isOnboarded &&
          row.user.profile.visibility === "PUBLIC",
      )
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
      where: { isPublic: true, status: "READY" },
      orderBy: { updatedAt: "desc" },
      take: 40,
      include: {
        user: {
          include: {
            profile: {
              select: {
                username: true,
                displayName: true,
                visibility: true,
                isOnboarded: true,
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
      if (!profile?.isOnboarded || profile.visibility !== "PUBLIC") continue;
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

/** Public hub listings: profile copy plus at least one public READY source (see trendingExperts). */
function profileHasPublicHubDescription(profile: {
  bio: string | null;
  headline: string | null;
}): boolean {
  const bio = profile.bio?.trim() ?? "";
  const headline = profile.headline?.trim() ?? "";
  return bio.length > 0 || headline.length > 0;
}

function emptyResults(): SearchResultGroup {
  return {
    people: [],
    skills: [],
    topics: [],
    knowledge: [],
    questions: [],
  };
}
