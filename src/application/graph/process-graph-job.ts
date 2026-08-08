import type { ExtractGraphFromKnowledge } from "@/application/graph/extract-graph-from-knowledge";
import type { SyncProfileToGraph } from "@/application/graph/sync-profile-to-graph";
import type { PrismaGraphRepository } from "@/infrastructure/database/repositories/graph-repository";

export class ProcessGraphJob {
  constructor(
    private readonly repo: PrismaGraphRepository,
    private readonly extractFromKnowledge: ExtractGraphFromKnowledge,
    private readonly syncProfile: SyncProfileToGraph,
  ) {}

  async execute(jobId: string): Promise<void> {
    const job = await this.repo.findJobById(jobId);
    if (!job || job.status !== "PENDING") return;

    const claimed = await this.repo.markJobProcessing(jobId);
    if (!claimed) return;

    await this.runJob(job.id, job.userId, job.jobType, job.payload);
  }

  async processNextPending(): Promise<boolean> {
    const job = await this.repo.claimNextJob();
    if (!job) return false;
    await this.runJob(job.id, job.userId, job.jobType, job.payload);
    return true;
  }

  private async runJob(
    jobId: string,
    userId: string,
    jobType: string,
    payload: unknown,
  ): Promise<void> {
    try {
      if (jobType === "EXTRACT_FROM_KNOWLEDGE") {
        const p = payload as { knowledgeSourceId?: string };
        if (!p.knowledgeSourceId) {
          throw new Error("Missing knowledgeSourceId in job payload");
        }
        await this.extractFromKnowledge.execute(p.knowledgeSourceId, userId);
      } else if (jobType === "SYNC_PROFILE" || jobType === "BACKFILL_USER") {
        await this.syncProfile.execute(userId);
      }

      await this.repo.completeJob(jobId, "COMPLETED");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Graph job failed";
      await this.repo.completeJob(jobId, "FAILED", message);
    }
  }
}
