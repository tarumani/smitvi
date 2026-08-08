import type { GraphEntityType } from "@/generated/prisma/client";
import type { GraphService } from "@/application/graph/graph-service";
import type {
  EntityRequirement,
  InterpretedEntity,
  InterpretedQuery,
  SearchFilters,
  SearchIntent,
} from "@/domain/search/types";
import { normalizeEntityName, slugifyEntityName } from "@/domain/graph/normalize";

const STOP_WORDS = new Set([
  "find",
  "a",
  "an",
  "the",
  "best",
  "top",
  "someone",
  "somebody",
  "person",
  "people",
  "expert",
  "experts",
  "who",
  "with",
  "and",
  "for",
  "me",
  "in",
  "that",
  "has",
  "have",
  "knows",
  "know",
  "using",
  "use",
  "uses",
]);

const INTENT_PATTERNS: Array<{ intent: SearchIntent; pattern: RegExp }> = [
  { intent: "MENTOR_DISCOVERY", pattern: /\bmentor\b/i },
  { intent: "COLLABORATOR_DISCOVERY", pattern: /\bcollaborat/i },
  { intent: "KNOWLEDGE_DISCOVERY", pattern: /\b(article|template|course|knowledge)\b/i },
  { intent: "PROJECT_DISCOVERY", pattern: /\b(project|portfolio|built|app|application)\b/i },
  { intent: "COMPANY_DISCOVERY", pattern: /\b(company|employer|worked at)\b/i },
  { intent: "SKILL_DISCOVERY", pattern: /\b(skill|skills)\b/i },
  { intent: "TOPIC_DISCOVERY", pattern: /\btopic\b/i },
  { intent: "EXPERT_DISCOVERY", pattern: /\b(designer|developer|engineer|consultant|specialist)\b/i },
];

const INDUSTRY_HINTS = [
  "healthcare",
  "fintech",
  "finance",
  "banking",
  "startup",
  "saas",
  "ecommerce",
  "education",
];

const PROJECT_HINTS = [
  "mobile app",
  "mobile application",
  "web app",
  "dashboard",
  "banking app",
];

const PROFESSION_PATTERNS: Array<{ profession: string; pattern: RegExp }> = [
  { profession: "UX Designer", pattern: /\b(ux|ui\/ux|ui ux)\b/i },
  { profession: "UI Designer", pattern: /\bui designer\b/i },
  { profession: "Product Designer", pattern: /\bproduct design/i },
  { profession: "React Developer", pattern: /\breact developer\b/i },
  { profession: "React Native Developer", pattern: /\breact native\b/i },
];

export class QueryUnderstandingService {
  constructor(private readonly graph: GraphService) {}

  async interpret(rawQuery: string): Promise<InterpretedQuery> {
    const normalized = normalizeQuery(rawQuery);
    const intent = detectIntent(normalized);
    const entities: InterpretedEntity[] = [];

    for (const { profession, pattern } of PROFESSION_PATTERNS) {
      if (pattern.test(normalized)) {
        entities.push(
          await this.entity("PROFESSION", profession, "REQUIRED"),
        );
      }
    }

    for (const industry of INDUSTRY_HINTS) {
      if (normalized.includes(industry)) {
        entities.push(
          await this.entity(
            "INDUSTRY",
            titleCase(industry),
            normalized.includes(" or ") ? "OR" : "REQUIRED",
          ),
        );
      }
    }

    for (const project of PROJECT_HINTS) {
      if (normalized.includes(project)) {
        entities.push(
          await this.entity("PROJECT", titleCase(project), "REQUIRED"),
        );
      }
    }

    const orSegment = normalized.match(
      /\b([\w\s]+)\s+or\s+([\w\s]+)\b/i,
    );
    if (orSegment) {
      const a = orSegment[1].trim();
      const b = orSegment[2].trim();
      if (a.length > 1) {
        entities.push(
          await this.entity("TECHNOLOGY", titleCase(a), "OR", "tech-or"),
        );
      }
      if (b.length > 1) {
        entities.push(
          await this.entity("TECHNOLOGY", titleCase(b), "OR", "tech-or"),
        );
      }
    }

    const toolSkillTokens = extractSkillLikeTokens(normalized);
    for (const token of toolSkillTokens) {
      const type: GraphEntityType =
        /figma|sketch|notion|jira|slack/i.test(token) ? "TOOL" : "SKILL";
      const requirement: EntityRequirement =
        /\boptional\b/i.test(normalized) && token.length < 8
          ? "OPTIONAL"
          : "REQUIRED";
      entities.push(await this.entity(type, titleCase(token), requirement));
    }

    const filters: SearchFilters = {};
    if (entities.find((e) => e.type === "PROFESSION")) {
      filters.profession = entities.find((e) => e.type === "PROFESSION")?.value;
    }

    return {
      raw: rawQuery.trim(),
      normalized,
      intent,
      entities: dedupeEntities(entities),
      filters,
    };
  }

  private async entity(
    type: GraphEntityType,
    value: string,
    requirement: EntityRequirement,
    orGroup?: string,
  ): Promise<InterpretedEntity> {
    const resolved = await this.graph.resolveEntity({
      entityType: type,
      name: value,
      ownerUserId: null,
    });
    return {
      type,
      value,
      requirement,
      orGroup,
      graphEntityId: resolved?.id ?? null,
      resolved: Boolean(resolved),
    };
  }
}

export function normalizeQuery(q: string): string {
  return q
    .trim()
    .toLowerCase()
    .replace(/[^\w\s/+.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function detectIntent(normalized: string): SearchIntent {
  for (const { intent, pattern } of INTENT_PATTERNS) {
    if (pattern.test(normalized)) return intent;
  }
  if (/\bfind\b|\bwho\b|\bsearch\b/.test(normalized)) {
    return "EXPERT_DISCOVERY";
  }
  return "EXPERT_DISCOVERY";
}

function extractSkillLikeTokens(normalized: string): string[] {
  const known = [
    "figma",
    "ux research",
    "ux design",
    "ui design",
    "design systems",
    "react",
    "react native",
    "html",
    "css",
    "typescript",
    "healthcare ux",
  ];
  const found: string[] = [];
  for (const k of known) {
    if (normalized.includes(k)) found.push(k);
  }
  const words = normalized
    .split(" ")
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
  for (const w of words) {
    if (/^[a-z]{3,}$/.test(w) && !INDUSTRY_HINTS.includes(w)) {
      found.push(w);
    }
  }
  return Array.from(new Set(found)).slice(0, 8);
}

function titleCase(s: string): string {
  return s
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function dedupeEntities(entities: InterpretedEntity[]): InterpretedEntity[] {
  const seen = new Set<string>();
  return entities.filter((e) => {
    const key = `${e.type}:${e.value.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function validateEntitiesAgainstGraph(
  graph: GraphService,
  entities: InterpretedEntity[],
): Promise<InterpretedEntity[]> {
  const out: InterpretedEntity[] = [];
  for (const ent of entities) {
    if (ent.type === "KEYWORD") {
      out.push(ent);
      continue;
    }
    const resolved = await graph.resolveEntity({
      entityType: ent.type,
      name: ent.value,
      ownerUserId: null,
    });
    out.push({
      ...ent,
      graphEntityId: resolved?.id ?? ent.graphEntityId,
      resolved: Boolean(resolved),
    });
  }
  return out;
}

export function entityToSlug(value: string): string {
  return slugifyEntityName(value);
}
