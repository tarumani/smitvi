import {
  INSUFFICIENT_EVIDENCE_REPLY,
  TWIN_INJECTION_GUARD,
} from "@/config/twin-ai";
import type { TwinCitation } from "@/application/chat/ask-twin";
import type {
  TwinClaimLevel,
  TwinConfidenceLevel,
  TwinContradiction,
  TwinEvidenceItem,
  TwinGraphBundle,
  TwinIntent,
  TwinResponseMode,
  TwinUnderstanding,
} from "@/domain/twin/types";
import type { RetrievedChunk } from "@/domain/knowledge/entities";

export class TwinResponseGenerator {
  buildSystemPrompt(input: {
    ownerDisplayName: string;
    mode: TwinResponseMode;
    claimLevel: TwinClaimLevel;
    contradictions: TwinContradiction[];
  }): string {
    const voice =
      input.mode === "representative"
        ? "You may answer in first person on behalf of the user, but ONLY for verified or supported facts."
        : `Refer to the subject as "${input.ownerDisplayName}" (third person). Do not claim you personally worked unless in representative mode.`;

    const contradictionNote =
      input.contradictions.length > 0
        ? "Conflicting sources were detected — mention the conflict and do not pick one silently."
        : "";

    return [
      TWIN_INJECTION_GUARD,
      "You are a Graph-Aware Knowledge Twin.",
      voice,
      "Use ONLY the provided context blocks. Cite sources as [1], [2] matching block order.",
      "Label inferences clearly. Never invent companies, projects, clients, certifications, or years.",
      "Prioritize USER_VERIFIED graph facts over AI_DETECTED or inferred profile fields. If confidence is low, phrase carefully, for example: 'It appears that this person has experience in healthcare, based on the information available in their profile.'",
      `Claim strength: ${input.claimLevel}.`,
      contradictionNote,
      `If context lacks verified facts, reply exactly: "${INSUFFICIENT_EVIDENCE_REPLY}"`,
    ]
      .filter(Boolean)
      .join(" ");
  }

  buildContextBlocks(input: {
    graph: TwinGraphBundle | null;
    ragChunks: RetrievedChunk[];
    profileBlock: string | null;
    memoryBlock: string | null;
    recommendationBlock: string | null;
  }): string[] {
    const blocks: string[] = [];
    if (input.graph?.summaryLines.length) {
      blocks.push(`[Graph]\n${input.graph.summaryLines.join("\n")}`);
    }
    if (input.profileBlock) {
      blocks.push(`[Profile]\n${input.profileBlock}`);
    }
    if (input.recommendationBlock) {
      blocks.push(`[Recommendations]\n${input.recommendationBlock}`);
    }
    if (input.memoryBlock) {
      blocks.push(`[Recent conversation — not verified facts]\n${input.memoryBlock}`);
    }
    for (const [i, chunk] of input.ragChunks.entries()) {
      blocks.push(`[${blocks.length + 1}] (${chunk.sourceTitle})\n${chunk.content}`);
    }
    return blocks;
  }

  buildCitations(
    ragChunks: RetrievedChunk[],
    evidence: TwinEvidenceItem[],
  ): { citations: TwinCitation[]; extended: TwinEvidenceItem[] } {
    const citations: TwinCitation[] = ragChunks.map((item) => ({
      sourceId: item.sourceId,
      sourceTitle: item.sourceTitle,
      chunkId: item.id,
      excerpt: item.content.slice(0, 220),
      score: Number(item.score.toFixed(4)),
    }));
    return { citations, extended: evidence };
  }

  shouldAnswer(input: {
    confidenceLevel: TwinConfidenceLevel;
    claimLevel: TwinClaimLevel;
    intent: TwinIntent;
    hasEvidence: boolean;
    ragCanAnswer: boolean;
    useLlm: boolean;
    hallucinationProbe?: boolean;
  }): boolean {
    if (input.intent === "CONVERSATIONAL") return true;
    if (input.hallucinationProbe && !input.hasEvidence) return false;
    if (!input.useLlm && input.hasEvidence) return true;
    if (input.intent === "SKILL_QUERY" && input.hasEvidence) return true;
    if (input.claimLevel === "UNKNOWN" && !input.ragCanAnswer) return false;
    return input.ragCanAnswer || (input.hasEvidence && input.confidenceLevel !== "UNKNOWN");
  }

  relatedQuestions(intent: TwinIntent): string[] {
    const map: Partial<Record<TwinIntent, string[]>> = {
      SKILL_QUERY: [
        "What evidence supports my top skills?",
        "What should I learn next?",
      ],
      PROJECT_QUERY: [
        "Which projects relate to healthcare?",
        "Show sources for my portfolio projects.",
      ],
      RECOMMENDATION_QUERY: [
        "Who should I collaborate with?",
        "What opportunities fit my expertise?",
      ],
    };
    return map[intent] ?? ["Tell me more with sources.", "What are my strongest skills?"];
  }

  suggestedActions(intent: TwinIntent): string[] {
    if (intent === "CONTENT_GENERATION") {
      return ["Create a case study", "Add to profile", "Share"];
    }
    if (intent === "RECOMMENDATION_QUERY") {
      return ["Find related experts", "Show evidence"];
    }
    return ["Show evidence", "Tell me more", "Update my knowledge"];
  }

  deterministicAnswer(input: {
    understanding: TwinUnderstanding;
    graph: TwinGraphBundle | null;
    ownerDisplayName: string;
  }): string | null {
    if (input.understanding.intent === "CONVERSATIONAL") {
      return conversationalReply(input.understanding.rawQuestion);
    }
    if (
      input.understanding.intent === "SKILL_QUERY" &&
      /what skills do i have/i.test(input.understanding.rawQuestion) &&
      input.graph
    ) {
      const list = input.graph.skills.length
        ? input.graph.skills
        : input.graph.expertise;
      if (list.length === 0) return null;
      return `Based on ${input.ownerDisplayName}'s intelligence graph, documented skills include: ${list.slice(0, 12).join(", ")}.`;
    }
    return null;
  }
}

function conversationalReply(rawQuestion: string): string {
  const q = rawQuestion.trim().toLowerCase();
  if (/^(hi|hello|hey|good (morning|afternoon|evening))\b/.test(q)) {
    return "Hello! Ask me anything about the knowledge graph, profile, or sources — I’m here to help.";
  }
  if (/^(thanks|thank you|thx|ty|thankyou)\b/.test(q)) {
    return "You’re welcome! Glad that helped — ask anytime if you need anything else.";
  }
  return "Sounds good. Let me know if there’s anything else you’d like to dig into.";
}
