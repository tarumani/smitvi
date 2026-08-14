import { getCurrentSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { NotFoundError } from "@/domain/shared/errors";
import { prisma } from "@/infrastructure/database/prisma";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";
import { getClientIp } from "@/infrastructure/http/respond";

type RouteContext = { params: Promise<{ username: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    getRateLimiter().consume(
      `profile:public:${getClientIp(_request) ?? "anon"}`,
    );

    const { username } = await context.params;
    const profile = await container.profiles.findByUsername(username);

    if (!profile || profile.visibility === "PRIVATE") {
      throw new NotFoundError("Profile not found");
    }

    const session = await getCurrentSession();
    const isOwner = session?.user.id === profile.userId;
    const isFollowing = session
      ? await container.social.isFollowing(session.user.id, profile.userId)
      : false;

    const [publicKnowledge, reviews, intelligenceRow, consultationOffer] =
      await Promise.all([
      container.knowledge.listPublicByUser(profile.userId),
      container.social.listReviews(profile.userId, 12),
      prisma.profile.findUnique({
        where: { userId: profile.userId },
        select: { intelligencePoints: true },
      }),
      container.consultations.getEnabledOfferByUserId(profile.userId),
    ]);

    return jsonOk({
      profile: {
        ...profile,
        intelligencePoints: intelligenceRow?.intelligencePoints ?? 0,
      },
      isOwner,
      isFollowing,
      publicKnowledge: publicKnowledge.map((k) => ({
        id: k.id,
        title: k.title,
        summary: k.summary,
        type: k.type,
        topics: k.topics,
        updatedAt: k.updatedAt,
      })),
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        reviewerUsername: r.reviewerUsername,
        createdAt: r.createdAt,
      })),
      consultationOffer: consultationOffer
        ? {
            headline: consultationOffer.headline,
            description: consultationOffer.description,
            durationMinutes: consultationOffer.durationMinutes,
            priceCents: consultationOffer.priceCents,
            currency: consultationOffer.currency,
          }
        : null,
    });
  } catch (error) {
    return jsonError(error);
  }
}
