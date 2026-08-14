import { z } from "zod";
import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { NotFoundError, ValidationError } from "@/domain/shared/errors";
import { jsonCreated, jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";

type RouteContext = { params: Promise<{ username: string }> };

const bodySchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional().nullable(),
});

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { username } = await context.params;
    const profile = await container.profiles.findByUsername(username);
    if (!profile || profile.visibility === "PRIVATE") {
      throw new NotFoundError("Profile not found");
    }
    const reviews = await container.social.listReviews(profile.userId);
    return jsonOk({ reviews });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { username } = await context.params;
    getRateLimiter().consume(`review:${session.user.id}`);

    const profile = await container.profiles.findByUsername(username);
    if (!profile || profile.visibility === "PRIVATE") {
      throw new NotFoundError("Profile not found");
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ValidationError("Invalid review payload");
    }

    const review = await container.social.createReview({
      reviewerId: session.user.id,
      revieweeId: profile.userId,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    });

    void container.socialActivityPush
      .notifyNewReview({
        revieweeUserId: profile.userId,
        reviewerUserId: session.user.id,
        rating: review.rating,
        reviewerName: review.reviewerName,
        reviewerUsername: review.reviewerUsername,
      })
      .catch((err) => console.warn("[push:review]", err));

    return jsonCreated({ review });
  } catch (error) {
    return jsonError(error);
  }
}
