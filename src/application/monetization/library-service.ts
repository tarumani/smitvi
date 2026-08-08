import { prisma } from "@/infrastructure/database/prisma";
import { ValidationError } from "@/domain/shared/errors";

export class LibraryService {
  async listForUser(userId: string) {
    const [access, orders, twinSubs] = await Promise.all([
      prisma.marketplaceAccess.findMany({
        where: { userId },
        include: {
          listing: {
            select: {
              id: true,
              title: true,
              type: true,
              slug: true,
              thumbnailUrl: true,
              contentReference: true,
              knowledgeSourceId: true,
            },
          },
        },
        orderBy: { grantedAt: "desc" },
      }),
      prisma.marketplaceOrder.findMany({
        where: { buyerId: userId, status: { in: ["PAID", "FULFILLED"] } },
        include: { listing: { select: { title: true, type: true } } },
        take: 30,
      }),
      prisma.twinCreatorSubscription.findMany({
        where: { subscriberId: userId, status: "ACTIVE" },
        include: {
          creator: {
            include: {
              profile: { select: { username: true, displayName: true } },
            },
          },
        },
      }),
    ]);

    return { access, orders, twinSubscriptions: twinSubs };
  }
}

export class ReviewService {
  async create(input: {
    userId: string;
    listingId: string;
    rating: number;
    body?: string | null;
  }) {
    if (input.rating < 1 || input.rating > 5) {
      throw new ValidationError("Rating must be 1–5");
    }

    const access = await prisma.marketplaceAccess.findUnique({
      where: {
        userId_listingId: {
          userId: input.userId,
          listingId: input.listingId,
        },
      },
    });

    const review = await prisma.marketplaceReview.upsert({
      where: {
        listingId_userId: {
          listingId: input.listingId,
          userId: input.userId,
        },
      },
      create: {
        listingId: input.listingId,
        userId: input.userId,
        rating: input.rating,
        body: input.body,
        verifiedPurchase: Boolean(access),
      },
      update: {
        rating: input.rating,
        body: input.body,
      },
    });

    const agg = await prisma.marketplaceReview.aggregate({
      where: { listingId: input.listingId },
      _avg: { rating: true },
      _count: { id: true },
    });

    await prisma.marketplaceListing.update({
      where: { id: input.listingId },
      data: {
        ratingAverage: agg._avg.rating ?? 0,
        ratingCount: agg._count.id,
      },
    });

    return review;
  }
}
