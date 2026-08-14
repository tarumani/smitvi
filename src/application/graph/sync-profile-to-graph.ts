import type { GraphService } from "@/application/graph/graph-service";
import type { PrismaGraphRepository } from "@/infrastructure/database/repositories/graph-repository";
import { slugifyEntityName } from "@/domain/graph/normalize";
import { slugifySkill } from "@/domain/profile/value-objects";

export class SyncProfileToGraph {
  constructor(
    private readonly graph: GraphService,
    private readonly repo: PrismaGraphRepository,
  ) {}

  async execute(userId: string): Promise<{ relationshipsCreated: number }> {
    const profile = await this.repo.findProfileForGraphSync(userId);
    if (!profile) return { relationshipsCreated: 0 };

    const userEntity = await this.graph.ensureUserEntity(
      userId,
      profile.displayName,
    );

    let count = 0;

    for (const ps of profile.skills) {
      const skillEntity = await this.ensureSkillGraphEntity(
        ps.skill.name,
        ps.skill.id,
        ps.skill.slug,
      );
      await this.graph.createRelationship({
        sourceEntityId: userEntity.id,
        relationshipType: "USER_HAS_SKILL",
        targetEntityId: skillEntity.id,
        confidenceScore: 1,
        source: "PROFILE",
        verified: true,
        verificationStatus: "USER_VERIFIED",
        evidence: {
          sourceType: "PROFILE_FIELD",
          sourceId: profile.id,
          contentReference: `profile_skill:${ps.id}`,
          confidence: 1,
        },
        metadata: { profileSkillId: ps.id, level: ps.level },
      });
      count += 1;
    }

    for (const exp of profile.experiences) {
      const company = await this.graph.createEntity({
        entityType: "COMPANY",
        name: exp.company,
        ownerUserId: null,
        visibility: "PUBLIC",
        aliasSource: "USER",
      });
      await this.graph.createRelationship({
        sourceEntityId: userEntity.id,
        relationshipType: "USER_WORKED_AT",
        targetEntityId: company.id,
        confidenceScore: 1,
        source: "PROFILE",
        verified: true,
        verificationStatus: "USER_VERIFIED",
        evidence: {
          sourceType: "PROFILE_FIELD",
          sourceId: profile.id,
          contentReference: `experience:${exp.id}`,
          contentExcerpt: exp.title.slice(0, 200),
          confidence: 1,
        },
        metadata: {
          experienceId: exp.id,
          title: exp.title,
          isCurrent: exp.isCurrent,
        },
      });
      count += 1;
    }

    for (const item of profile.portfolio) {
      const project = await this.graph.createEntity({
        entityType: "PROJECT",
        name: item.title,
        description: item.description,
        ownerUserId: userId,
        visibility: profile.visibility === "PUBLIC" ? "PUBLIC" : "PRIVATE",
        aliasSource: "USER",
        metadata: { portfolioItemId: item.id, url: item.url },
      });
      await this.graph.createRelationship({
        sourceEntityId: userEntity.id,
        relationshipType: "USER_CREATED_PROJECT",
        targetEntityId: project.id,
        confidenceScore: 1,
        source: "PROFILE",
        verified: true,
        verificationStatus: "USER_VERIFIED",
        evidence: {
          sourceType: "PROFILE_FIELD",
          sourceId: profile.id,
          contentReference: `portfolio:${item.id}`,
          confidence: 1,
        },
      });
      count += 1;
    }

    if (profile.profession?.trim()) {
      const profession = await this.graph.createEntity({
        entityType: "PROFESSION",
        name: profile.profession.trim(),
        ownerUserId: null,
        visibility: "PUBLIC",
        aliasSource: "USER",
      });
      await this.graph.createRelationship({
        sourceEntityId: userEntity.id,
        relationshipType: "USER_HAS_EXPERTISE",
        targetEntityId: profession.id,
        confidenceScore: 1,
        source: "PROFILE",
        verified: true,
        verificationStatus: "USER_VERIFIED",
        evidence: {
          sourceType: "PROFILE_FIELD",
          sourceId: profile.id,
          contentReference: "profession",
          confidence: 1,
        },
      });
      count += 1;
    }

    const expertiseAreas = Array.isArray(profile.expertiseAreas)
      ? (profile.expertiseAreas as unknown[]).filter(
          (i): i is string => typeof i === "string" && i.trim().length > 0,
        )
      : [];
    for (const area of expertiseAreas) {
      const entity = await this.graph.createEntity({
        entityType: "PROFESSION",
        name: area.trim(),
        ownerUserId: null,
        visibility: "PUBLIC",
        aliasSource: "USER",
      });
      await this.graph.createRelationship({
        sourceEntityId: userEntity.id,
        relationshipType: "USER_HAS_EXPERTISE",
        targetEntityId: entity.id,
        confidenceScore: 1,
        source: "PROFILE",
        verified: true,
        verificationStatus: "USER_VERIFIED",
        evidence: {
          sourceType: "PROFILE_FIELD",
          sourceId: profile.id,
          contentReference: "expertise_areas",
          contentExcerpt: area.slice(0, 200),
          confidence: 1,
        },
      });
      count += 1;
    }

    const industries = Array.isArray(profile.industries)
      ? (profile.industries as unknown[]).filter(
          (i): i is string => typeof i === "string" && i.trim().length > 0,
        )
      : [];
    for (const industry of industries) {
      const entity = await this.graph.createEntity({
        entityType: "INDUSTRY",
        name: industry.trim(),
        ownerUserId: null,
        visibility: "PUBLIC",
        aliasSource: "USER",
      });
      await this.graph.createRelationship({
        sourceEntityId: userEntity.id,
        relationshipType: "USER_WORKS_IN_INDUSTRY",
        targetEntityId: entity.id,
        confidenceScore: 1,
        source: "PROFILE",
        verified: true,
        verificationStatus: "USER_VERIFIED",
        evidence: {
          sourceType: "PROFILE_FIELD",
          sourceId: profile.id,
          contentReference: "industries",
          contentExcerpt: industry.slice(0, 200),
          confidence: 1,
        },
      });
      count += 1;
    }

    const interests = Array.isArray(profile.interests)
      ? (profile.interests as unknown[]).filter(
          (i): i is string => typeof i === "string" && i.trim().length > 0,
        )
      : [];

    for (const topic of interests) {
      const topicEntity = await this.graph.createEntity({
        entityType: "TOPIC",
        name: topic.trim(),
        ownerUserId: null,
        visibility: "PUBLIC",
        aliasSource: "USER",
      });
      await this.graph.createRelationship({
        sourceEntityId: userEntity.id,
        relationshipType: "USER_INTERESTED_IN",
        targetEntityId: topicEntity.id,
        confidenceScore: 1,
        source: "PROFILE",
        verified: true,
        verificationStatus: "USER_VERIFIED",
        evidence: {
          sourceType: "PROFILE_FIELD",
          sourceId: profile.id,
          contentReference: "interests",
          confidence: 1,
        },
      });
      count += 1;
    }

    return { relationshipsCreated: count };
  }

  private async ensureSkillGraphEntity(
    name: string,
    skillId: string,
    slug: string,
  ) {
    const existing = await this.repo.findEntityBySkillId(skillId);
    if (existing) return existing;

    const bySlug = await this.graph.findEntity("SKILL", slug, null);
    if (bySlug) {
      return bySlug;
    }

    return this.repo.createEntity({
      entityType: "SKILL",
      canonicalName: name,
      slug: slugifySkill(name) || slug,
      skillId,
      ownerUserId: null,
      visibility: "PUBLIC",
      aliases: [
        {
          alias: name,
          normalizedAlias: slugifyEntityName(name),
          source: "USER",
        },
      ],
    });
  }
}
