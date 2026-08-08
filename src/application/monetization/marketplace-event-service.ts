import type { Prisma } from "@/generated/prisma/client";
import type { MarketplaceEventType } from "@/generated/prisma/client";
import { prisma } from "@/infrastructure/database/prisma";

export class MarketplaceEventService {
  async track(input: {
    eventType: MarketplaceEventType;
    userId?: string | null;
    creatorId?: string | null;
    listingId?: string | null;
    orderId?: string | null;
    metadata?: Record<string, unknown>;
  }) {
    try {
      await prisma.marketplaceEvent.create({
        data: {
          eventType: input.eventType,
          userId: input.userId ?? null,
          creatorId: input.creatorId ?? null,
          listingId: input.listingId ?? null,
          orderId: input.orderId ?? null,
          metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
        },
      });
    } catch {
      /* migration may be pending */
    }
  }
}
