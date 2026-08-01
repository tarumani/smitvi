import type { KnowledgeSourceType } from "@/domain/knowledge/entities";
import { ValidationError } from "@/domain/shared/errors";

const mimeMap: Record<string, KnowledgeSourceType> = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "DOCX",
  "application/msword": "DOCX",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    "PPTX",
  "text/plain": "TXT",
  "text/markdown": "MARKDOWN",
  "text/x-markdown": "MARKDOWN",
};

const extensionMap: Record<string, KnowledgeSourceType> = {
  pdf: "PDF",
  docx: "DOCX",
  doc: "DOCX",
  pptx: "PPTX",
  txt: "TXT",
  md: "MARKDOWN",
  markdown: "MARKDOWN",
};

export function resolveKnowledgeType(
  fileName: string,
  mimeType: string | null | undefined,
): KnowledgeSourceType {
  if (mimeType && mimeMap[mimeType]) {
    return mimeMap[mimeType];
  }

  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  const fromExt = extensionMap[ext];
  if (fromExt) return fromExt;

  throw new ValidationError(
    "Unsupported file type. Upload PDF, Word, PowerPoint, TXT, or Markdown.",
  );
}

export const ACCEPTED_UPLOAD_EXTENSIONS = [
  ".pdf",
  ".docx",
  ".doc",
  ".pptx",
  ".txt",
  ".md",
  ".markdown",
] as const;
