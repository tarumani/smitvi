import type {
  TwinQueryPlan,
  TwinSource,
  TwinUnderstanding,
} from "@/domain/twin/types";

export class TwinQueryPlanner {
  plan(
    understanding: TwinUnderstanding,
    options?: { hasOrganization?: boolean; askMemory?: boolean },
  ): TwinQueryPlan {
    if (options?.hasOrganization) {
      return {
        sources: ["RAG"],
        useLlm: true,
        maxGraphEntities: 0,
        rationale: "Organization workspace — knowledge RAG only.",
      };
    }

    const sources = new Set<TwinSource>(understanding.requiredSources);

    if (/yesterday|last time|you said|i told you/i.test(understanding.rawQuestion)) {
      sources.add("MEMORY");
    }

    if (
      understanding.intent === "RECOMMENDATION_QUERY" ||
      understanding.intent === "LEARNING_QUERY"
    ) {
      sources.add("RECOMMENDATION");
      sources.add("GRAPH");
    }

    if (
      understanding.intent === "SKILL_QUERY" &&
      /what skills/i.test(understanding.rawQuestion)
    ) {
      sources.delete("RAG");
      sources.add("GRAPH");
      sources.add("PROFILE");
    }

    if (sources.size === 0) sources.add("RAG");

    const useLlm =
      understanding.intent !== "SKILL_QUERY" ||
      !/what skills do i have/i.test(understanding.rawQuestion);

    return {
      sources: [...sources],
      useLlm,
      maxGraphEntities: 12,
      rationale: `Plan for ${understanding.intent}`,
    };
  }
}
