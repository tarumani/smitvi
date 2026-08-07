import { calculateMarketplaceSplit } from "@/config/billing";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/domain/shared/errors";
import type {
  MarketplaceListingStatus,
  MarketplaceListingType,
  PaymentProvider,
} from "@/generated/prisma/enums";
import { prisma } from "@/infrastructure/database/prisma";

export class PrismaMarketplaceRepository {
  async listActiveBySeller(sellerId: string) {
    return prisma.marketplaceListing.findMany({
      where: { sellerId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  }

  async countRecentSellerOrders(sellerId: string, days = 30): Promise<number> {
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - days);
    return prisma.marketplaceOrder.count({
      where: {
        sellerId,
        createdAt: { gte: since },
        status: { in: ["PENDING", "PAID", "FULFILLED"] },
      },
    });
  }

  async listRecentSellerOrders(sellerId: string, take = 30) {
    return prisma.marketplaceOrder.findMany({
      where: { sellerId },
      orderBy: { createdAt: "desc" },
      take,
      include: {
        listing: { select: { title: true, type: true } },
        buyer: {
          include: {
            profile: { select: { username: true, displayName: true } },
          },
        },
      },
    });
  }

  async listActive(limit = 40) {
    return prisma.marketplaceListing.findMany({
      where: { status: "ACTIVE" },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      take: limit,
      include: {
        seller: {
          include: {
            profile: {
              select: {
                username: true,
                displayName: true,
                avatarUrl: true,
                headline: true,
              },
            },
          },
        },
      },
    });
  }

  async listBySeller(sellerId: string) {
    return prisma.marketplaceListing.findMany({
      where: { sellerId },
      orderBy: { createdAt: "desc" },
    });
  }

  async findListing(id: string) {
    return prisma.marketplaceListing.findUnique({
      where: { id },
      include: {
        seller: {
          include: {
            profile: {
              select: {
                username: true,
                displayName: true,
                avatarUrl: true,
                headline: true,
              },
            },
          },
        },
      },
    });
  }

  async createListing(input: {
    sellerId: string;
    type: MarketplaceListingType;
    title: string;
    description: string;
    currency: string;
    priceCents: number;
    durationMinutes?: number | null;
    knowledgeSourceId?: string | null;
    status?: MarketplaceListingStatus;
  }) {
    if (input.priceCents < 100) {
      throw new ValidationError("Minimum price is 1.00 in listing currency");
    }

    return prisma.marketplaceListing.create({
      data: {
        sellerId: input.sellerId,
        type: input.type,
        title: input.title.trim(),
        description: input.description.trim(),
        currency: input.currency.toUpperCase(),
        priceCents: input.priceCents,
        durationMinutes: input.durationMinutes,
        knowledgeSourceId: input.knowledgeSourceId,
        status: input.status ?? "ACTIVE",
      },
    });
  }

  async updateListingStatus(
    id: string,
    sellerId: string,
    status: MarketplaceListingStatus,
  ) {
    const listing = await prisma.marketplaceListing.findFirst({
      where: { id, sellerId },
    });
    if (!listing) throw new NotFoundError("Listing not found");

    return prisma.marketplaceListing.update({
      where: { id },
      data: { status },
    });
  }

  async updateListing(
    id: string,
    sellerId: string,
    input: {
      type?: MarketplaceListingType;
      title?: string;
      description?: string;
      currency?: string;
      priceCents?: number;
      durationMinutes?: number | null;
    },
  ) {
    const listing = await prisma.marketplaceListing.findFirst({
      where: { id, sellerId },
    });
    if (!listing) throw new NotFoundError("Listing not found");

    if (input.priceCents !== undefined && input.priceCents < 100) {
      throw new ValidationError("Minimum price is 1.00 in listing currency");
    }

    return prisma.marketplaceListing.update({
      where: { id },
      data: {
        ...(input.type !== undefined ? { type: input.type } : {}),
        ...(input.title !== undefined
          ? { title: input.title.trim() }
          : {}),
        ...(input.description !== undefined
          ? { description: input.description.trim() }
          : {}),
        ...(input.currency !== undefined
          ? { currency: input.currency.toUpperCase() }
          : {}),
        ...(input.priceCents !== undefined
          ? { priceCents: input.priceCents }
          : {}),
        ...(input.durationMinutes !== undefined
          ? { durationMinutes: input.durationMinutes }
          : {}),
      },
    });
  }

  async createOrder(input: {
    listingId: string;
    buyerId: string;
    provider: PaymentProvider;
  }) {
    const listing = await prisma.marketplaceListing.findUnique({
      where: { id: input.listingId },
    });
    if (!listing || listing.status !== "ACTIVE") {
      throw new NotFoundError("Listing is not available");
    }
    if (listing.sellerId === input.buyerId) {
      throw new ForbiddenError("You cannot purchase your own listing");
    }

    const split = calculateMarketplaceSplit(listing.priceCents);

    return prisma.marketplaceOrder.create({
      data: {
        listingId: listing.id,
        buyerId: input.buyerId,
        sellerId: listing.sellerId,
        status: "PENDING",
        currency: listing.currency,
        grossAmountCents: listing.priceCents,
        commissionRate: split.commissionRate,
        commissionCents: split.commissionCents,
        netAmountCents: split.netAmountCents,
        provider: input.provider,
      },
      include: { listing: true },
    });
  }

  async markOrderPaid(orderId: string) {
    const order = await prisma.marketplaceOrder.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundError("Order not found");
    // Idempotent for webhook retries
    if (order.status === "PAID" || order.status === "FULFILLED") {
      return order;
    }

    return prisma.marketplaceOrder.update({
      where: { id: orderId },
      data: {
        status: "PAID",
        paidAt: new Date(),
      },
    });
  }

  async listOrdersForUser(userId: string) {
    return prisma.marketplaceOrder.findMany({
      where: {
        OR: [{ buyerId: userId }, { sellerId: userId }],
      },
      orderBy: { createdAt: "desc" },
      include: {
        listing: true,
        buyer: {
          include: { profile: { select: { username: true, displayName: true } } },
        },
        seller: {
          include: { profile: { select: { username: true, displayName: true } } },
        },
      },
      take: 50,
    });
  }

  /** Net seller earnings from completed marketplace orders (PAID / FULFILLED). */
  async sumSellerNetEarningsCents(sellerId: string): Promise<number> {
    const result = await prisma.marketplaceOrder.aggregate({
      where: {
        sellerId,
        status: { in: ["PAID", "FULFILLED"] },
      },
      _sum: { netAmountCents: true },
    });
    return result._sum.netAmountCents ?? 0;
  }

  async sumSellerNetEarningsThisMonthCents(sellerId: string): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setUTCDate(1);
    startOfMonth.setUTCHours(0, 0, 0, 0);

    const result = await prisma.marketplaceOrder.aggregate({
      where: {
        sellerId,
        status: { in: ["PAID", "FULFILLED"] },
        paidAt: { gte: startOfMonth },
      },
      _sum: { netAmountCents: true },
    });
    return result._sum.netAmountCents ?? 0;
  }

  async topEarners(limit = 5) {
    const grouped = await prisma.marketplaceOrder.groupBy({
      by: ["sellerId"],
      where: { status: { in: ["PAID", "FULFILLED"] } },
      _sum: { netAmountCents: true },
      orderBy: { _sum: { netAmountCents: "desc" } },
      take: limit,
    });

    if (grouped.length === 0) return [];

    const sellerIds = grouped.map((row) => row.sellerId);
    const profiles = await prisma.profile.findMany({
      where: { userId: { in: sellerIds }, isOnboarded: true },
      select: {
        userId: true,
        username: true,
        displayName: true,
        headline: true,
      },
    });
    const profileByUser = new Map(profiles.map((p) => [p.userId, p]));

    return grouped
      .map((row) => {
        const profile = profileByUser.get(row.sellerId);
        if (!profile) return null;
        return {
          username: profile.username,
          displayName: profile.displayName,
          headline: profile.headline,
          netEarningsCents: row._sum.netAmountCents ?? 0,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);
  }
}
