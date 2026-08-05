import { UnauthorizedError, ValidationError } from "@/domain/shared/errors";
import type { ImportJobEntity } from "@/infrastructure/database/repositories/import-job-repository";
import { PrismaImportJobRepository } from "@/infrastructure/database/repositories/import-job-repository";
import { ProcessImportJob } from "@/application/import/process-import-job";

export class CreateImportJob {
  constructor(
    private readonly importJobs: PrismaImportJobRepository,
    private readonly processor: ProcessImportJob,
  ) {}

  async execute(
    userId: string | null | undefined,
    rawInput: unknown,
  ): Promise<ImportJobEntity> {
    if (!userId) {
      throw new UnauthorizedError();
    }

    const body =
      typeof rawInput === "object" && rawInput !== null
        ? (rawInput as Record<string, unknown>)
        : {};

    const type = body.type;
    if (type !== "WEBSITE") {
      throw new ValidationError("Only WEBSITE import is supported here");
    }

    const sourceUrl =
      typeof body.sourceUrl === "string" ? body.sourceUrl.trim() : "";
    if (!sourceUrl) {
      throw new ValidationError("sourceUrl is required");
    }

    try {
      new URL(sourceUrl);
    } catch {
      throw new ValidationError("Enter a valid website URL");
    }

    const job = await this.importJobs.create({
      userId,
      type: "WEBSITE",
      sourceUrl,
    });

    await this.processor.execute(job.id, userId);

    const refreshed = await this.importJobs.findByIdForUser(job.id, userId);
    return refreshed ?? job;
  }
}
