import type { TwinIntent, TwinSource, TwinUnderstanding } from "@/domain/twin/types";

const INDUSTRY_HINTS = [
  "healthcare",
  "fintech",
  "finance",
  "banking",
  "saas",
  "education",
  "mobile",
];

const INTENT_RULES: Array<{ intent: TwinIntent; pattern: RegExp }> = [
  { intent: "RECOMMENDATION_QUERY", pattern: /\b(recommend|who should i|follow|collaborat|opportunit)/i },
  { intent: "LEARNING_QUERY", pattern: /\b(learn|learning gap|what should i learn|skill to explore)/i },
  { intent: "CONTENT_GENERATION", pattern: /\b(write|generate|draft|create a (bio|post|email|case study|resume))/i },
  { intent: "SKILL_QUERY", pattern: /\b(skills?|expert in|expertise in)\b/i },
  { intent: "PROJECT_QUERY", pattern: /\b(projects?|portfolio|built|application|app)\b/i },
  { intent: "EXPERIENCE_QUERY", pattern: /\b(experience|worked at|employer|years)\b/i },
  { intent: "CAREER_QUERY", pattern: /\b(career|job history|background)\b/i },
  { intent: "PORTFOLIO_QUERY", pattern: /\b(portfolio|case study|showcase)\b/i },
  { intent: "KNOWLEDGE_QUERY", pattern: /\b(wrote about|uploaded|document|article|source)\b/i },
  { intent: "EXPERTISE_QUERY", pattern: /\b(strongest|weakest|best at|specializ)/i },
  { intent: "COMPARISON_QUERY", pattern: /\b(compare|versus|vs\.?|difference between)\b/i },
  { intent: "EXPLANATION_QUERY", pattern: /\b(explain|why|how do i)\b/i },
  { intent: "PERSONAL_FACT_RETRIEVAL", pattern: /\b(what|which|tell me about my|do i have)\b/i },
];

export class TwinQueryUnderstandingService {
  understand(
    question: string,
    options?: { subject?: "twin_owner" | "other_expert" },
  ): TwinUnderstanding {
    const rawQuestion = question.trim();
    const lower = rawQuestion.toLowerCase();

    let intent: TwinIntent = "UNKNOWN";
    for (const rule of INTENT_RULES) {
      if (rule.pattern.test(rawQuestion)) {
        intent = rule.intent;
        break;
      }
    }
    if (intent === "UNKNOWN" && rawQuestion.includes("?")) {
      intent = "PERSONAL_FACT_RETRIEVAL";
    }

    const entities = extractEntities(lower);
    const requiredSources = defaultSourcesForIntent(intent);

    return {
      intent,
      entities,
      subject: options?.subject ?? "twin_owner",
      requiredSources,
      rawQuestion,
    };
  }
}

function extractEntities(lowerQuestion: string): string[] {
  const found = new Set<string>();
  for (const hint of INDUSTRY_HINTS) {
    if (lowerQuestion.includes(hint)) found.add(hint);
  }
  const tools = ["figma", "react", "ux", "ui", "healthcare", "nasa"];
  for (const t of tools) {
    if (lowerQuestion.includes(t)) found.add(t);
  }
  const quoted = [...lowerQuestion.matchAll(/"([^"]+)"/g)].map((m) => m[1]!);
  for (const q of quoted) found.add(q);
  return [...found];
}

function defaultSourcesForIntent(intent: TwinIntent): TwinSource[] {
  switch (intent) {
    case "SKILL_QUERY":
    case "EXPERIENCE_QUERY":
    case "PROJECT_QUERY":
    case "CAREER_QUERY":
    case "PORTFOLIO_QUERY":
      return ["GRAPH", "RAG", "PROFILE"];
    case "KNOWLEDGE_QUERY":
      return ["GRAPH", "RAG"];
    case "RECOMMENDATION_QUERY":
    case "LEARNING_QUERY":
      return ["GRAPH", "RECOMMENDATION"];
    case "CONTENT_GENERATION":
      return ["GRAPH", "RAG", "PROFILE"];
    case "PERSONAL_FACT_RETRIEVAL":
      return ["GRAPH", "RAG", "PROFILE"];
    default:
      return ["GRAPH", "RAG", "PROFILE"];
  }
}
