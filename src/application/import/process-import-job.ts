import { ValidationError } from "@/domain/shared/errors";
import type { PrismaKnowledgeRepository } from "@/infrastructure/database/repositories/knowledge-repository";
import { PrismaImportJobRepository } from "@/infrastructure/database/repositories/import-job-repository";
import { ProcessKnowledgeSource } from "@/application/knowledge/process-knowledge-source";
import { fetchWebsiteText } from "@/infrastructure/web/fetch-website-text";

export class ProcessImportJob {
  constructor(
    private readonly importJobs: PrismaImportJobRepository,
    private readonly knowledge: PrismaKnowledgeRepository,
    private readonly processor: ProcessKnowledgeSource,
  ) {}

  async execute(jobId: string, userId: string): Promise<void> {
    const job = await this.importJobs.findByIdForUser(jobId, userId);
    if (!job || job.type !== "WEBSITE" || !job.sourceUrl) {
      return;
    }

    await this.importJobs.updateStatus(jobId, "PROCESSING");

    try {
      const extractedText = await fetchWebsiteText(job.sourceUrl);
      const title = new URL(job.sourceUrl).hostname.replace(/^www\./, "");

      const source = await this.knowledge.createFromWebsite({
        userId,
        title,
        sourceUrl: job.sourceUrl,
        extractedText,
      });

      await this.processor.execute(source.id, userId);

      await this.importJobs.updateStatus(jobId, "COMPLETED", {
        knowledgeSourceId: source.id,
        errorMessage: null,
      });
    } catch (error) {
      const message =
        error instanceof ValidationError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Import failed";
      await this.importJobs.updateStatus(jobId, "FAILED", {
        errorMessage: message,
      });
      throw error;
    }
  }
}
