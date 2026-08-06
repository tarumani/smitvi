import type { ImportJobType } from "@/generated/prisma/client";
import { UnauthorizedError, ValidationError } from "@/domain/shared/errors";
import type { ImportJobEntity } from "@/infrastructure/database/repositories/import-job-repository";
import { PrismaImportJobRepository } from "@/infrastructure/database/repositories/import-job-repository";
import { ProcessImportJob } from "@/application/import/process-import-job";

const ALLOWED_TYPES: ImportJobType[] = [
  "WEBSITE",
  "LINKEDIN",
  "GITHUB",
  "YOUTUBE",
];

function validateUrlForType(type: ImportJobType, sourceUrl: string): void {
  let url: URL;
  try {
    url = new URL(sourceUrl);
  } catch {
    throw new ValidationError("Enter a valid URL");
  }

  const host = url.hostname.replace(/^www\./, "");

  switch (type) {
    case "GITHUB":
      if (host !== "github.com") {
        throw new ValidationError("Enter a github.com profile or repository URL");
      }
      break;
    case "YOUTUBE":
      if (
        !["youtube.com", "youtu.be", "m.youtube.com"].includes(host)
      ) {
        throw new ValidationError("Enter a YouTube video or channel URL");
      }
      break;
    case "LINKEDIN":
      if (host !== "linkedin.com") {
        throw new ValidationError("Enter a linkedin.com profile or company URL");
      }
      break;
    case "WEBSITE":
      break;
    default:
      throw new ValidationError("Unsupported import type");
  }
}

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

    const typeRaw = body.type;
    if (
      typeof typeRaw !== "string" ||
      !ALLOWED_TYPES.includes(typeRaw as ImportJobType)
    ) {
      throw new ValidationError(
        "type must be WEBSITE, LINKEDIN, GITHUB, or YOUTUBE",
      );
    }
    const type = typeRaw as ImportJobType;

    const sourceUrl =
      typeof body.sourceUrl === "string" ? body.sourceUrl.trim() : "";
    if (!sourceUrl) {
      throw new ValidationError("sourceUrl is required");
    }

    validateUrlForType(type, sourceUrl);

    const job = await this.importJobs.create({
      userId,
      type,
      sourceUrl,
    });

    await this.processor.execute(job.id, userId);

    const refreshed = await this.importJobs.findByIdForUser(job.id, userId);
    return refreshed ?? job;
  }
}
