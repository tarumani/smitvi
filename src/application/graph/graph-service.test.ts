import { describe, expect, it, vi } from "vitest";
import { GraphService } from "@/application/graph/graph-service";
import type { PrismaGraphRepository } from "@/infrastructure/database/repositories/graph-repository";

function mockRepo(
  overrides: Partial<PrismaGraphRepository> = {},
): PrismaGraphRepository {
  return {
    findEntityBySlugScope: vi.fn().mockResolvedValue(null),
    findEntityByNormalizedAlias: vi.fn().mockResolvedValue(null),
    createEntity: vi.fn().mockImplementation(async (data) => ({
      id: "ent-1",
      entityType: data.entityType,
      canonicalName: data.canonicalName,
      slug: data.slug,
      description: null,
      metadata: {},
      ownerUserId: data.ownerUserId ?? null,
      linkedUserId: null,
      skillId: null,
      visibility: "PUBLIC",
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
    ...overrides,
  } as unknown as PrismaGraphRepository;
}

describe("GraphService.resolveEntity", () => {
  it("returns existing entity by slug", async () => {
    const existing = {
      id: "skill-figma",
      entityType: "SKILL" as const,
      canonicalName: "Figma",
      slug: "figma",
      description: null,
      metadata: {},
      ownerUserId: null,
      linkedUserId: null,
      skillId: null,
      visibility: "PUBLIC" as const,
      status: "ACTIVE" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const repo = mockRepo({
      findEntityBySlugScope: vi.fn().mockResolvedValue(existing),
    });
    const service = new GraphService(repo);
    const resolved = await service.resolveEntity({
      entityType: "SKILL",
      name: "Figma",
    });
    expect(resolved?.id).toBe("skill-figma");
  });

  it("createEntity delegates to resolve before insert", async () => {
    const repo = mockRepo();
    const service = new GraphService(repo);
    await service.createEntity({
      entityType: "TECHNOLOGY",
      name: "React",
    });
    expect(repo.createEntity).toHaveBeenCalledOnce();
  });
});

describe("GraphService authorization", () => {
  it("allows owner to view private entity", async () => {
    const repo = mockRepo();
    const service = new GraphService(repo);
    await expect(
      service.assertEntityVisibleToViewer(
        {
          id: "1",
          entityType: "PROJECT",
          canonicalName: "P",
          slug: "p",
          description: null,
          metadata: {},
          ownerUserId: "user-a",
          linkedUserId: null,
          skillId: null,
          visibility: "PRIVATE",
          status: "ACTIVE",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        "user-a",
      ),
    ).resolves.toBeUndefined();
  });
});
