import {
  ANSWER_MIN_CONFIDENCE,
  ANSWER_MIN_TOP_SCORE,
  RETRIEVAL_MIN_SCORE,
  RETRIEVAL_TOP_K,
} from "@/config/ai";
import { averageScore } from "@/domain/knowledge/similarity";
import type { PrismaKnowledgeRepository } from "@/infrastructure/database/repositories/knowledge-repository";

const ENTITY_BOOST = 0.08;
const ENTITY_BOOST_CAP = 0.24;

export class GraphAwareRetriever {
  constructor(private readonly knowledge: PrismaKnowledgeRepository) {}

  async retrieve(input: {
    ownerUserId: string;
    queryEmbedding: number[];
    publicOnly: boolean;
    organizationId?: string | null;
    focusEntities: string[];
  }) {
    const retrieved = await this.knowledge.searchSimilar({
      ownerUserId: input.ownerUserId,
      queryEmbedding: input.queryEmbedding,
      topK: RETRIEVAL_TOP_K,
      minScore: RETRIEVAL_MIN_SCORE,
      publicOnly: input.publicOnly,
      organizationId: input.organizationId,
    });

    const boosted = retrieved
      .map((item) => {
        const lower = item.content.toLowerCase();
        let boost = 0;
        for (const entity of input.focusEntities) {
          if (lower.includes(entity.toLowerCase())) {
            boost += ENTITY_BOOST;
          }
        }
        boost = Math.min(ENTITY_BOOST_CAP, boost);
        return { ...item, score: Math.min(1, item.score + boost) };
      })
      .sort((a, b) => b.score - a.score);

    const scores = boosted.map((i) => i.score);
    const topScore = scores.length > 0 ? Math.max(...scores) : 0;
    const confidence = averageScore(
      scores.slice(0, Math.min(3, scores.length)),
    );

    return {
      chunks: boosted,
      topScore,
      confidence,
      canAnswerRag:
        boosted.length > 0 &&
        topScore >= ANSWER_MIN_TOP_SCORE &&
        confidence >= ANSWER_MIN_CONFIDENCE,
    };
  }
}
