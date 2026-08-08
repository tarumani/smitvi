import type { PrismaMarketplaceRepository } from "@/infrastructure/database/repositories/marketplace-repository";
import type { CreatorWalletService } from "@/application/monetization/creator-wallet-service";
import type { MarketplaceGraphSyncService } from "@/application/monetization/marketplace-graph-sync-service";
import type { MarketplaceEventService } from "@/application/monetization/marketplace-event-service";
import { prisma } from "@/infrastructure/database/prisma";

/** Idempotent post-payment fulfillment. */
export class MarketplaceFulfillmentService {
  constructor(
    private readonly marketplace: PrismaMarketplaceRepository,
    private readonly wallet: CreatorWalletService,
    private readonly graphSync: MarketplaceGraphSyncService,
    private readonly events: MarketplaceEventService,
  ) {}

  async fulfillPaidOrder(orderId: string) {
    const order = await this.marketplace.markOrderPaid(orderId);
    if (order.status !== "PAID") return order;

    await prisma.marketplaceAccess.upsert({
      where: {
        userId_listingId: {
          userId: order.buyerId,
          listingId: order.listingId,
        },
      },
      create: {
        userId: order.buyerId,
        listingId: order.listingId,
        orderId: order.id,
      },
      update: { orderId: order.id },
    });

    await prisma.marketplaceListing.update({
      where: { id: order.listingId },
      data: { salesCount: { increment: 1 } },
    });

    await this.wallet.creditFromOrder({
      sellerId: order.sellerId,
      netAmountCents: order.netAmountCents,
      currency: order.currency,
    });

    await this.events.track({
      eventType: "PRODUCT_PURCHASED",
      userId: order.buyerId,
      creatorId: order.sellerId,
      listingId: order.listingId,
      orderId: order.id,
    });

    const listing = await prisma.marketplaceListing.findUnique({
      where: { id: order.listingId },
    });
    if (listing) {
      await this.graphSync.onPurchase(listing.sellerId, listing.title, listing.id);
    }

    return order;
  }
}
