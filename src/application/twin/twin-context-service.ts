import type { TwinIntelligenceEngine } from "@/application/twin/twin-intelligence-engine";
import type { GraphService } from "@/application/graph/graph-service";
import type { PrismaProfileRepository } from "@/infrastructure/database/repositories/profile-repository";

export class TwinContextService {
  constructor(
    private readonly graph: GraphService,
    private readonly profiles: PrismaProfileRepository,
    private readonly engine: TwinIntelligenceEngine,
  ) {}

  async getContext(input: {
    ownerUserId: string;
    viewerUserId: string;
    question?: string;
  }) {
    const profile = await this.profiles.findByUserId(input.ownerUserId);
    const graph = await this.graph.getUserGraph(
      input.ownerUserId,
      input.viewerUserId,
    );

    let prepared = null;
    if (input.question && input.question.length > 2) {
      prepared = await this.engine.prepare({
        ownerUserId: input.ownerUserId,
        viewerUserId: input.viewerUserId,
        question: input.question,
        conversationId: "00000000-0000-0000-0000-000000000000",
        publicOnly: input.viewerUserId !== input.ownerUserId,
      });
    }

    return {
      identity: profile
        ? {
            displayName: profile.displayName,
            username: profile.username,
            headline: profile.headline,
          }
        : null,
      skills: graph.skills.map((s) => s.entity.canonicalName),
      projects: graph.projects.map((p) => p.entity.canonicalName),
      industries: graph.industries.map((i) => i.entity.canonicalName),
      technologies: graph.technologies.map((t) => t.entity.canonicalName),
      evidence: prepared?.extendedCitations ?? [],
      confidence: prepared?.confidence ?? null,
      confidenceLevel: prepared?.confidenceLevel ?? null,
    };
  }
}
