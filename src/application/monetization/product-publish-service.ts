import type { PrismaMarketplaceRepository } from "@/infrastructure/database/repositories/marketplace-repository";
import type { MarketplaceGraphSyncService } from "@/application/monetization/marketplace-graph-sync-service";
import { slugifyEntityName } from "@/domain/graph/normalize";
import { ValidationError } from "@/domain/shared/errors";
import { prisma } from "@/infrastructure/database/prisma";

export class ProductPublishService {
  constructor(
    private readonly marketplace: PrismaMarketplaceRepository,
    private readonly graphSync: MarketplaceGraphSyncService,
  ) {}

  async publish(listingId: string, sellerId: string) {
    const listing = await prisma.marketplaceListing.findFirst({
      where: { id: listingId, sellerId },
    });
    if (!listing) throw new ValidationError("Listing not found");
    if (listing.status === "ARCHIVED") {
      throw new ValidationError("Cannot publish archived listing");
    }

    const slug =
      listing.slug ??
      (slugifyEntityName(listing.title).slice(0, 100) ||
        `product-${listingId.slice(0, 8)}`);

    const updated = await prisma.marketplaceListing.update({
      where: { id: listingId },
      data: {
        status: "ACTIVE",
        slug,
        publishedAt: new Date(),
      },
    });

    await this.graphSync.onPublish(sellerId, updated.title, updated.id);
    return updated;
  }

  async createDraft(input: Parameters<PrismaMarketplaceRepository["createListing"]>[0]) {
    return this.marketplace.createListing({
      ...input,
      status: "DRAFT",
    });
  }
}
