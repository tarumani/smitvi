import type {
  TwinEvidenceItem,
  TwinGraphBundle,
} from "@/domain/twin/types";
import type { RetrievedChunk } from "@/domain/knowledge/entities";

export class TwinEvidenceFusion {
  fuse(input: {
    graph: TwinGraphBundle | null;
    ragChunks: RetrievedChunk[];
    profileBlock: string | null;
  }): TwinEvidenceItem[] {
    const out: TwinEvidenceItem[] = [];

    if (input.graph) {
      out.push(...input.graph.evidence);
    }

    for (const chunk of input.ragChunks) {
      out.push({
        id: `doc:${chunk.id}`,
        type: "DOCUMENT",
        title: chunk.sourceTitle,
        excerpt: chunk.content.slice(0, 220),
        reference: chunk.sourceId,
        confidence: chunk.score,
        claimLevel: chunk.score >= 0.55 ? "SUPPORTED" : "INFERRED",
        sourceId: chunk.sourceId,
        chunkId: chunk.id,
        verified: false,
      });
    }

    if (input.profileBlock) {
      out.push({
        id: "profile:block",
        type: "PROFILE",
        title: "Profile",
        excerpt: input.profileBlock.slice(0, 240),
        confidence: 0.85,
        claimLevel: "VERIFIED",
        verified: true,
      });
    }

    return dedupeByTitle(out).slice(0, 20);
  }
}

function dedupeByTitle(items: TwinEvidenceItem[]) {
  const seen = new Set<string>();
  const result: TwinEvidenceItem[] = [];
  for (const item of items) {
    const key = `${item.type}:${item.title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}
