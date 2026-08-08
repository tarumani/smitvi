import type { LearningGapItem } from "@/domain/recommendations/types";
import type { GraphService } from "@/application/graph/graph-service";

const GAP_CATALOG: Array<{
  name: string;
  triggers: string[];
  why: string;
  learning: string[];
}> = [
  {
    name: "Accessibility",
    triggers: ["ux", "ui", "design", "figma"],
    why: "Designers with healthcare/fintech UX often need WCAG accessibility skills.",
    learning: ["WCAG basics", "Inclusive design", "Accessibility audits"],
  },
  {
    name: "Design Systems",
    triggers: ["figma", "ui", "design"],
    why: "Scales UI work across products and teams.",
    learning: ["Component libraries", "Tokens", "Documentation"],
  },
  {
    name: "AI UX",
    triggers: ["ux", "product", "healthcare", "ai"],
    why: "AI products need specialized UX patterns.",
    learning: ["Prompt UX", "Human-in-the-loop", "Trust & transparency"],
  },
  {
    name: "React basics",
    triggers: ["design", "figma", "ux"],
    why: "Helps designers collaborate with engineering on modern web apps.",
    learning: ["HTML/CSS", "React components", "Design handoff"],
  },
];

export class LearningGapService {
  constructor(private readonly graph: GraphService) {}

  async analyze(userId: string): Promise<LearningGapItem[]> {
    const g = await this.graph.getUserGraph(userId, userId);
    const have = new Set(
      [
        ...g.skills,
        ...g.topics,
        ...g.technologies,
        ...g.expertise,
      ].map((x) => x.entity.canonicalName.toLowerCase()),
    );

    const blob = [...have].join(" ");
    const gaps: LearningGapItem[] = [];

    for (const item of GAP_CATALOG) {
      if (have.has(item.name.toLowerCase())) continue;
      const relevant = item.triggers.some((t) => blob.includes(t));
      if (!relevant) continue;

      gaps.push({
        skillOrTopic: item.name,
        whyItMatters: item.why,
        suggestedLearning: item.learning,
        relatedExpertUsernames: [],
      });
    }

    return gaps.slice(0, 5);
  }
}
