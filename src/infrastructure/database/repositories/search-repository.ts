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

export class PrismaSearchRepository {
  async search(query: string, limit = 8): Promise<SearchResultGroup> {
    const q = query.trim();
    if (q.length < 2) {
      return emptyResults();
    }

    const like = `%${q}%`;

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
                  skill: { name: { contains: q, mode: "insensitive" } },
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
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { slug: { contains: q, mode: "insensitive" } },
          ],
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
    return prisma.profile.findMany({
      where: { visibility: "PUBLIC", isOnboarded: true },
      orderBy: [{ followersCount: "desc" }, { ratingAverage: "desc" }],
      take: limit,
      select: {
        username: true,
        displayName: true,
        headline: true,
        avatarUrl: true,
        followersCount: true,
        ratingAverage: true,
      },
    });
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
