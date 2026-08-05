import type { ProfileRepository } from "@/domain/profile/ports";
import type { PrismaKnowledgeRepository } from "@/infrastructure/database/repositories/knowledge-repository";

export function computeReputationScore(input: {
  ratingAverage: number;
  ratingCount: number;
  followersCount: number;
  readyKnowledgeCount: number;
}): number {
  const reviewScore = Math.min(
    40,
    input.ratingAverage * 8 + Math.min(input.ratingCount, 20),
  );
  const followerScore = Math.min(
    30,
    Math.log10(input.followersCount + 1) * 15,
  );
  const knowledgeScore = Math.min(30, input.readyKnowledgeCount * 6);
  return Math.round(Math.min(100, reviewScore + followerScore + knowledgeScore));
}

export class UpdateReputation {
  constructor(
    private readonly profiles: ProfileRepository,
    private readonly knowledge: PrismaKnowledgeRepository,
  ) {}

  async execute(userId: string): Promise<number> {
    const profile = await this.profiles.findByUserId(userId);
    if (!profile) {
      return 0;
    }

    const readyKnowledgeCount = await this.knowledge.countReadySources(userId, {
      publicOnly: false,
    });

    const score = computeReputationScore({
      ratingAverage: profile.ratingAverage,
      ratingCount: profile.ratingCount,
      followersCount: profile.followersCount,
      readyKnowledgeCount,
    });

    await this.profiles.updateReputationScore(userId, score);
    return score;
  }
}
