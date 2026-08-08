import type { GraphService } from "@/application/graph/graph-service";
import type {
  TwinEvidenceItem,
  TwinGraphBundle,
  TwinUnderstanding,
} from "@/domain/twin/types";

export class TwinGraphRetriever {
  constructor(private readonly graph: GraphService) {}

  async retrieve(
    ownerUserId: string,
    viewerUserId: string,
    understanding: TwinUnderstanding,
    maxEntities: number,
  ): Promise<TwinGraphBundle | null> {
    const g = await this.graph.getUserGraph(ownerUserId, viewerUserId);
    if (!g.userEntity) return null;

    const skills = g.skills.map((x) => x.entity.canonicalName);
    const expertise = g.expertise.map((x) => x.entity.canonicalName);
    const projects = g.projects.map((x) => x.entity.canonicalName);
    const companies = g.companies.map((x) => x.entity.canonicalName);
    const industries = g.industries.map((x) => x.entity.canonicalName);
    const technologies = g.technologies.map((x) => x.entity.canonicalName);
    const topics = g.topics.map((x) => x.entity.canonicalName);

    const focus = pickFocus(understanding, {
      skills,
      expertise,
      projects,
      companies,
      industries,
      technologies,
      topics,
    }).slice(0, maxEntities);

    const evidence: TwinEvidenceItem[] = [];
    const pushEdges = (
      items: typeof g.skills,
      type: TwinEvidenceItem["type"],
    ) => {
      for (const { entity, relationship } of items) {
        if (focus.length && !focus.some((f) => matches(f, entity.canonicalName))) {
          continue;
        }
        const verified = relationship.verificationStatus === "USER_VERIFIED";
        evidence.push({
          id: `graph:${relationship.id}`,
          type: type === "GRAPH" ? "GRAPH" : type,
          title: entity.canonicalName,
          excerpt: `${relationship.relationshipType.replace(/_/g, " ").toLowerCase()} (${Math.round(relationship.confidenceScore * 100)}% confidence)`,
          reference: entity.id,
          confidence: relationship.confidenceScore,
          claimLevel: verified
            ? "VERIFIED"
            : relationship.confidenceScore >= 0.65
              ? "SUPPORTED"
              : "INFERRED",
          graphRelationshipId: relationship.id,
          verified,
        });
      }
    };

    pushEdges(g.projects, "PROJECT");
    pushEdges(g.skills, "GRAPH");
    pushEdges(g.companies, "EXPERIENCE");
    pushEdges(g.expertise, "USER_VERIFIED");

    const summaryLines: string[] = [];
    if (skills.length) summaryLines.push(`Skills: ${skills.slice(0, 8).join(", ")}`);
    if (projects.length) {
      summaryLines.push(`Projects: ${filterByFocus(projects, focus).join(", ") || projects.slice(0, 6).join(", ")}`);
    }
    if (industries.length) summaryLines.push(`Industries: ${industries.join(", ")}`);
    if (technologies.length) {
      summaryLines.push(`Technologies: ${technologies.slice(0, 8).join(", ")}`);
    }

    return {
      skills,
      expertise,
      projects,
      companies,
      industries,
      technologies,
      topics,
      focusEntities: focus,
      evidence,
      summaryLines,
    };
  }

  getUserSkills = (b: TwinGraphBundle) => b.skills;
  getUserProjects = (b: TwinGraphBundle) => b.projects;
  getUserExperience = (b: TwinGraphBundle) => b.companies;
}

function pickFocus(
  understanding: TwinUnderstanding,
  buckets: Record<string, string[]>,
): string[] {
  const all = [
    ...buckets.skills,
    ...buckets.projects,
    ...buckets.industries,
    ...buckets.technologies,
    ...buckets.topics,
  ];
  if (understanding.entities.length === 0) return all.slice(0, 12);
  return all.filter((name) =>
    understanding.entities.some((e) => matches(e, name)),
  );
}

function filterByFocus(items: string[], focus: string[]) {
  if (!focus.length) return items.slice(0, 6);
  return items.filter((i) => focus.some((f) => matches(f, i)));
}

function matches(a: string, b: string) {
  const al = a.toLowerCase();
  const bl = b.toLowerCase();
  return al.includes(bl) || bl.includes(al);
}
