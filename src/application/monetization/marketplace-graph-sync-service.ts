import type { GraphService } from "@/application/graph/graph-service";
import { prisma } from "@/infrastructure/database/prisma";

export class MarketplaceGraphSyncService {
  constructor(private readonly graph: GraphService) {}

  async onPublish(sellerId: string, title: string, listingId: string) {
    try {
      const profile = await prisma.profile.findUnique({
        where: { userId: sellerId },
        select: { displayName: true },
      });
      const userEntity = await this.graph.ensureUserEntity(
        sellerId,
        profile?.displayName ?? "Creator",
      );
      const product = await this.graph.createEntity({
        entityType: "PROJECT",
        name: title.slice(0, 120),
        description: `Marketplace listing ${listingId}`,
        ownerUserId: sellerId,
        visibility: "PUBLIC",
        aliasSource: "USER",
      });
      await this.graph.createRelationship({
        sourceEntityId: userEntity.id,
        targetEntityId: product.id,
        relationshipType: "USER_CREATED_PROJECT",
        confidenceScore: 0.9,
        source: "USER",
        verificationStatus: "USER_VERIFIED",
      });
    } catch {
      /* non-blocking */
    }
  }

  async onPurchase(sellerId: string, title: string, listingId: string) {
    await this.onPublish(sellerId, title, listingId);
  }
}
