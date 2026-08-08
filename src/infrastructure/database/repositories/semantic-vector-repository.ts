import { profileHasDiscoverableHubCopy } from "@/domain/profile/qualified-public-hub";
import { qualifiedPublicKnowledgeSourceWhere } from "@/domain/profile/qualified-public-hub";
import { cosineSimilarity } from "@/domain/knowledge/similarity";
import { embedTexts } from "@/infrastructure/ai/openai-client";
import { prisma } from "@/infrastructure/database/prisma";

export type SemanticOwnerScore = {
  userId: string;
  username: string;
  score: number;
};

export class SemanticVectorRepository {
  async searchPublicOwnersByQuery(
    query: string,
    limit = 20,
  ): Promise<SemanticOwnerScore[]> {
    const q = query.trim();
    if (q.length < 2) return [];

    const [queryEmbedding] = await embedTexts([q]);
    if (!queryEmbedding?.length) return [];

    try {
      const vectorLiteral = `[${queryEmbedding.join(",")}]`;
      const rows = await prisma.$queryRaw<
        Array<{
          user_id: string;
          username: string;
          max_score: number;
        }>
      >`
        SELECT ks.user_id,
               p.username,
               MAX(1 - (kc.embedding_vector <=> ${vectorLiteral}::vector)) AS max_score
        FROM knowledge_chunks kc
        INNER JOIN knowledge_sources ks ON ks.id = kc.source_id
        INNER JOIN profiles p ON p.user_id = ks.user_id
        WHERE kc.embedding_vector IS NOT NULL
          AND ks.is_public = true
          AND ks.status = 'READY'
          AND p.visibility = 'PUBLIC'
          AND p.is_onboarded = true
        GROUP BY ks.user_id, p.username
        HAVING MAX(1 - (kc.embedding_vector <=> ${vectorLiteral}::vector)) >= 0.72
        ORDER BY max_score DESC
        LIMIT ${limit}
      `;

      return rows
        .filter((r) => r.username)
        .map((r) => ({
          userId: r.user_id,
          username: r.username,
          score: Number(r.max_score),
        }));
    } catch {
      return this.fallbackInMemory(queryEmbedding, limit);
    }
  }

  private async fallbackInMemory(
    queryEmbedding: number[],
    limit: number,
  ): Promise<SemanticOwnerScore[]> {
    const chunks = await prisma.knowledgeChunk.findMany({
      where: { source: qualifiedPublicKnowledgeSourceWhere },
      include: {
        source: {
          include: {
            user: {
              include: {
                profile: {
                  select: {
                    username: true,
                    userId: true,
                    bio: true,
                    headline: true,
                  },
                },
              },
            },
          },
        },
      },
      take: 800,
    });

    const byUser = new Map<string, SemanticOwnerScore>();
    for (const chunk of chunks) {
      const profile = chunk.source.user.profile;
      if (!profile || !profileHasDiscoverableHubCopy(profile)) continue;
      const score = cosineSimilarity(queryEmbedding, chunk.embedding);
      if (score < 0.72) continue;
      const prev = byUser.get(profile.userId);
      if (!prev || score > prev.score) {
        byUser.set(profile.userId, {
          userId: profile.userId,
          username: profile.username,
          score,
        });
      }
    }

    return [...byUser.values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}
