export type KnowledgeSourceType =
  | "PDF"
  | "DOCX"
  | "PPTX"
  | "TXT"
  | "MARKDOWN"
  | "ZIP"
  | "GITHUB"
  | "YOUTUBE"
  | "WEBSITE"
  | "NOTION"
  | "GOOGLE_DRIVE"
  | "IMAGE"
  | "VIDEO"
  | "AUDIO";

export type KnowledgeProcessingStatus =
  | "PENDING"
  | "EXTRACTING"
  | "CHUNKING"
  | "EMBEDDING"
  | "SUMMARIZING"
  | "READY"
  | "FAILED";

export type KnowledgeFaq = {
  readonly question: string;
  readonly answer: string;
};

export type KnowledgeSourceEntity = {
  readonly id: string;
  readonly userId: string;
  readonly organizationId: string | null;
  readonly type: KnowledgeSourceType;
  readonly title: string;
  readonly originalName: string | null;
  readonly mimeType: string | null;
  readonly byteSize: number | null;
  readonly storagePath: string | null;
  readonly sourceUrl: string | null;
  readonly status: KnowledgeProcessingStatus;
  readonly errorMessage: string | null;
  readonly summary: string | null;
  readonly faqs: readonly KnowledgeFaq[];
  readonly tags: readonly string[];
  readonly topics: readonly string[];
  readonly chunkCount: number;
  readonly isPublic: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly processedAt: Date | null;
};

export type KnowledgeChunkEntity = {
  readonly id: string;
  readonly sourceId: string;
  readonly userId: string;
  readonly chunkIndex: number;
  readonly content: string;
  readonly tokenCount: number;
  readonly embedding: readonly number[];
};

export type RetrievedChunk = KnowledgeChunkEntity & {
  readonly score: number;
  readonly sourceTitle: string;
};
