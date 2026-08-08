import { embedTexts } from "@/infrastructure/ai/openai-client";
import type { TwinCitation } from "@/application/chat/ask-twin";
import type { RecommendationService } from "@/application/recommendations/recommendation-service";
import type { PrismaKnowledgeRepository } from "@/infrastructure/database/repositories/knowledge-repository";
import type { PrismaProfileRepository } from "@/infrastructure/database/repositories/profile-repository";
import type { TwinPreparedIntelligence } from "@/domain/twin/types";
import { HALLUCINATION_PROBE_TERMS, INSUFFICIENT_EVIDENCE_REPLY } from "@/config/twin-ai";
import { GraphAwareRetriever } from "@/application/twin/graph-aware-retriever";
import { TwinConfidenceEngine } from "@/application/twin/twin-confidence-engine";
import { TwinContradictionEngine } from "@/application/twin/twin-contradiction-engine";
import { TwinEvidenceFusion } from "@/application/twin/twin-evidence-fusion";
import { TwinGraphRetriever } from "@/application/twin/twin-graph-retriever";
import { TwinMemoryService } from "@/application/twin/twin-memory-service";
import { TwinQueryPlanner } from "@/application/twin/twin-query-planner";
import { TwinQueryUnderstandingService } from "@/application/twin/twin-query-understanding-service";
import { TwinResponseGenerator } from "@/application/twin/twin-response-generator";
import type { TwinAnalyticsService } from "@/application/twin/twin-analytics-service";

export class TwinIntelligenceEngine {
  private readonly understanding = new TwinQueryUnderstandingService();
  private readonly planner = new TwinQueryPlanner();
  private readonly graphRetriever: TwinGraphRetriever;
  private readonly graphAwareRag: GraphAwareRetriever;
  private readonly fusion = new TwinEvidenceFusion();
  private readonly confidenceEngine = new TwinConfidenceEngine();
  private readonly contradictions = new TwinContradictionEngine();
  private readonly responseGen = new TwinResponseGenerator();

  constructor(
    graphRetriever: TwinGraphRetriever,
    knowledge: PrismaKnowledgeRepository,
    private readonly profiles: PrismaProfileRepository,
    private readonly memory: TwinMemoryService,
    private readonly recommendations: RecommendationService,
    private readonly analytics: TwinAnalyticsService,
  ) {
    this.graphRetriever = graphRetriever;
    this.graphAwareRag = new GraphAwareRetriever(knowledge);
  }

  async prepare(input: {
    ownerUserId: string;
    viewerUserId: string;
    question: string;
    conversationId: string;
    publicOnly: boolean;
    organizationId?: string | null;
    responseMode?: "factual" | "representative";
  }): Promise<
    TwinPreparedIntelligence & {
      retrieved: import("@/domain/knowledge/entities").RetrievedChunk[];
    }
  > {
    const started = Date.now();
    const understanding = this.understanding.understand(input.question);
    const plan = this.planner.plan(understanding, {
      hasOrganization: Boolean(input.organizationId),
      askMemory: /yesterday|last time/i.test(input.question),
    });

    const profile = await this.profiles.findByUserId(input.ownerUserId);
    const ownerDisplayName = profile?.displayName ?? "this expert";

    let graph = null as Awaited<ReturnType<TwinGraphRetriever["retrieve"]>>;
    if (plan.sources.includes("GRAPH") && !input.organizationId) {
      graph = await this.graphRetriever.retrieve(
        input.ownerUserId,
        input.viewerUserId,
        understanding,
        plan.maxGraphEntities,
      );
    }

    const profileBlock =
      plan.sources.includes("PROFILE") && profile
        ? [
            profile.displayName,
            profile.headline,
            profile.bio,
            profile.skills.map((s) => s.name).slice(0, 8).join(", "),
          ]
            .filter(Boolean)
            .join("\n")
        : null;

    let memoryBlock: string | null = null;
    if (plan.sources.includes("MEMORY")) {
      memoryBlock = await this.memory.getRecentContext(
        input.conversationId,
        input.viewerUserId,
      );
    }

    let recommendationBlock: string | null = null;
    if (
      plan.sources.includes("RECOMMENDATION") &&
      input.viewerUserId === input.ownerUserId
    ) {
      const gaps = await this.recommendations.getBundle(input.ownerUserId);
      recommendationBlock = gaps.learningGaps
        .slice(0, 3)
        .map((g) => `${g.skillOrTopic}: ${g.whyItMatters}`)
        .join("\n");
    }

    const [queryEmbedding] = await embedTexts([input.question]);
    const rag =
      plan.sources.includes("RAG") || !input.organizationId
        ? await this.graphAwareRag.retrieve({
            ownerUserId: input.ownerUserId,
            queryEmbedding: queryEmbedding ?? [],
            publicOnly: input.publicOnly,
            organizationId: input.organizationId,
            focusEntities: graph?.focusEntities ?? understanding.entities,
          })
        : {
            chunks: [],
            topScore: 0,
            confidence: 0,
            canAnswerRag: false,
          };

    const evidence = this.fusion.fuse({
      graph,
      ragChunks: rag.chunks,
      profileBlock,
    });

    const contradictionList = this.contradictions.detect({
      profileBio: profile?.bio ?? null,
      profileHeadline: profile?.headline ?? null,
      graphSummaryLines: graph?.summaryLines ?? [],
    });

    const confidenceResult = this.confidenceEngine.compute({
      evidence,
      ragConfidence: rag.confidence,
      ragTopScore: rag.topScore,
      graphEvidenceCount: graph?.evidence.length ?? 0,
    });

    const { citations, extended } = this.responseGen.buildCitations(
      rag.chunks,
      evidence,
    );

    const contextBlocks = this.responseGen.buildContextBlocks({
      graph,
      ragChunks: rag.chunks,
      profileBlock,
      memoryBlock,
      recommendationBlock,
    });

    const hallucinationProbe = HALLUCINATION_PROBE_TERMS.some((t) =>
      input.question.toLowerCase().includes(t),
    );

    const hasEvidence = evidence.length > 0;
    const canAnswer = this.responseGen.shouldAnswer({
      confidenceLevel: confidenceResult.level,
      claimLevel: confidenceResult.claimLevel,
      intent: understanding.intent,
      hasEvidence,
      ragCanAnswer: rag.canAnswerRag,
      useLlm: plan.useLlm,
      hallucinationProbe,
    });

    const systemPrompt = this.responseGen.buildSystemPrompt({
      ownerDisplayName,
      mode: input.responseMode ?? "factual",
      claimLevel: confidenceResult.claimLevel,
      contradictions: contradictionList,
    });

    void this.analytics.recordQuery({
      userId: input.viewerUserId,
      ownerUserId: input.ownerUserId,
      question: input.question,
      intent: understanding.intent,
      sources: plan.sources,
      confidence: confidenceResult.score,
      confidenceLevel: confidenceResult.level,
      latencyMs: Date.now() - started,
      graphUsed: Boolean(graph),
      ragUsed: rag.chunks.length > 0,
    });

    return {
      understanding,
      plan,
      graph,
      profileBlock,
      memoryBlock,
      recommendationBlock,
      evidence,
      contradictions: contradictionList,
      citations,
      extendedCitations: extended,
      contextBlocks,
      systemPrompt,
      confidence: confidenceResult.score,
      confidenceLevel: confidenceResult.level,
      claimLevel: confidenceResult.claimLevel,
      canAnswer,
      relatedQuestions: this.responseGen.relatedQuestions(understanding.intent),
      suggestedActions: this.responseGen.suggestedActions(understanding.intent),
      retrievalMeta: {
        graphUsed: Boolean(graph),
        ragUsed: rag.chunks.length > 0,
        ragChunkCount: rag.chunks.length,
      },
      retrieved: rag.chunks,
      deterministicFallback: this.responseGen.deterministicAnswer({
        understanding,
        graph,
        ownerDisplayName,
      }),
      insufficientReply: INSUFFICIENT_EVIDENCE_REPLY,
    };
  }
}
