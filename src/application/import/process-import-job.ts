import type { ImportJobType } from "@/generated/prisma/client";
import { ValidationError } from "@/domain/shared/errors";
import type { PrismaKnowledgeRepository } from "@/infrastructure/database/repositories/knowledge-repository";
import { PrismaImportJobRepository } from "@/infrastructure/database/repositories/import-job-repository";
import { ProcessKnowledgeSource } from "@/application/knowledge/process-knowledge-source";
import { fetchWebsiteText } from "@/infrastructure/web/fetch-website-text";
import {
  fetchGitHubImportText,
  fetchLinkedInImportText,
  fetchYouTubeImportText,
} from "@/infrastructure/web/fetch-social-import-text";

const URL_IMPORT_TYPES: ImportJobType[] = [
  "WEBSITE",
  "LINKEDIN",
  "GITHUB",
  "YOUTUBE",
  "NOTION",
];

export class ProcessImportJob {
  constructor(
    private readonly importJobs: PrismaImportJobRepository,
    private readonly knowledge: PrismaKnowledgeRepository,
    private readonly processor: ProcessKnowledgeSource,
  ) {}

  async execute(jobId: string, userId: string): Promise<void> {
    const job = await this.importJobs.findByIdForUser(jobId, userId);
    if (!job || !job.sourceUrl || !URL_IMPORT_TYPES.includes(job.type)) {
      return;
    }

    await this.importJobs.updateStatus(jobId, "PROCESSING");

    try {
      const { title, text, knowledgeType } = await extractForJobType(
        job.type,
        job.sourceUrl,
      );

      const source = await this.knowledge.createFromExtractedUrl({
        userId,
        type: knowledgeType,
        title,
        sourceUrl: job.sourceUrl,
        extractedText: text,
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

async function extractForJobType(
  type: ImportJobType,
  sourceUrl: string,
): Promise<{
  title: string;
  text: string;
  knowledgeType: "WEBSITE" | "GITHUB" | "YOUTUBE";
}> {
  switch (type) {
    case "GITHUB": {
      const result = await fetchGitHubImportText(sourceUrl);
      return { ...result, knowledgeType: "GITHUB" };
    }
    case "YOUTUBE": {
      const result = await fetchYouTubeImportText(sourceUrl);
      return { ...result, knowledgeType: "YOUTUBE" };
    }
    case "LINKEDIN": {
      const result = await fetchLinkedInImportText(sourceUrl);
      return { ...result, knowledgeType: "WEBSITE" };
    }
    case "NOTION": {
      const text = await fetchWebsiteText(sourceUrl, { preferReader: true });
      const title = notionTitleFromUrl(sourceUrl);
      return { title, text, knowledgeType: "WEBSITE" };
    }
    case "WEBSITE":
    default: {
      const text = await fetchWebsiteText(sourceUrl, {
        preferReader:
          sourceUrl.includes("notion.") ||
          sourceUrl.includes("docs.google.com"),
      });
      const title = new URL(sourceUrl).hostname.replace(/^www\./, "");
      return { title, text, knowledgeType: "WEBSITE" };
    }
  }
}

function notionTitleFromUrl(sourceUrl: string): string {
  try {
    const path = new URL(sourceUrl).pathname;
    const slug = path.split("/").filter(Boolean).pop();
    if (!slug) return "Notion page";
    return (
      decodeURIComponent(slug)
        .replace(/-/g, " ")
        .replace(/[a-f0-9]{32}$/i, "")
        .trim()
        .slice(0, 80) || "Notion page"
    );
  } catch {
    return "Notion page";
  }
}
