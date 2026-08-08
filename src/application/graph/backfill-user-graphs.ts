import type { GraphService } from "@/application/graph/graph-service";
import type { SyncProfileToGraph } from "@/application/graph/sync-profile-to-graph";
import type { PrismaGraphRepository } from "@/infrastructure/database/repositories/graph-repository";

export type BackfillProgress = {
  userId: string;
  ok: boolean;
  relationshipsCreated?: number;
  error?: string;
};

export class BackfillUserGraphs {
  constructor(
    private readonly repo: PrismaGraphRepository,
    private readonly syncProfile: SyncProfileToGraph,
    private readonly graph: GraphService,
  ) {}

  async executeForUser(userId: string): Promise<BackfillProgress> {
    try {
      await this.repo.createProcessingJob({
        userId,
        jobType: "BACKFILL_USER",
        payload: { startedAt: new Date().toISOString() },
      });
      const result = await this.syncProfile.execute(userId);
      return { userId, ok: true, relationshipsCreated: result.relationshipsCreated };
    } catch (error) {
      return {
        userId,
        ok: false,
        error: error instanceof Error ? error.message : "Backfill failed",
      };
    }
  }

  /** Idempotent: ensures USER entity + profile-derived edges. */
  async executeAll(options?: {
    limit?: number;
    onProgress?: (progress: BackfillProgress) => void;
  }): Promise<BackfillProgress[]> {
    const userIds = await this.repo.listUserIdsWithProfiles();
    const slice = options?.limit ? userIds.slice(0, options.limit) : userIds;
    const results: BackfillProgress[] = [];

    for (const userId of slice) {
      const profile = await this.repo.findProfileForGraphSync(userId);
      if (profile) {
        await this.graph.ensureUserEntity(userId, profile.displayName);
      }
      const row = await this.executeForUser(userId);
      results.push(row);
      options?.onProgress?.(row);
    }

    return results;
  }
}
