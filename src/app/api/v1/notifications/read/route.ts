import { z } from "zod";
import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { ValidationError } from "@/domain/shared/errors";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";

const activityKeySchema = z
  .string()
  .regex(/^(follow|review|sale|purchase):[0-9a-f-]{36}$/i);

const bodySchema = z.object({
  conversationIds: z.array(z.string().uuid()).optional(),
  markAllTwinInbox: z.boolean().optional(),
  activityKeys: z.array(activityKeySchema).optional(),
  markAllSocial: z.boolean().optional(),
});

export async function PATCH(request: Request) {
  try {
    const session = await requireSession();
    getRateLimiter().consume(`notifications:read:${session.user.id}`);

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ValidationError("Invalid read payload");
    }

    let conversationIds = parsed.data.conversationIds ?? [];
    if (parsed.data.markAllTwinInbox) {
      const inbox = await container.conversations.listInboxForOwner(
        session.user.id,
      );
      conversationIds = inbox.map((item) => item.id);
    }

    let activityKeys = parsed.data.activityKeys ?? [];
    if (parsed.data.markAllSocial) {
      const [followers, reviews, sales, purchases] = await Promise.all([
        container.social.listRecentFollowers(session.user.id, 12),
        container.social.listReviews(session.user.id, 12),
        container.marketplace.listRecentPaidSellerOrders(session.user.id, 12),
        container.marketplace.listRecentPaidBuyerOrders(session.user.id, 12),
      ]);
      activityKeys = [
        ...followers.map((f) => `follow:${f.id}`),
        ...reviews.map((r) => `review:${r.id}`),
        ...sales.map((o) => `sale:${o.id}`),
        ...purchases.map((o) => `purchase:${o.id}`),
      ];
    }

    const [twinMarked, socialMarked] = await Promise.all([
      container.twinInboxReads.markRead(session.user.id, conversationIds),
      container.socialActivityReads.markRead(session.user.id, activityKeys),
    ]);

    return jsonOk({ marked: twinMarked + socialMarked });
  } catch (error) {
    return jsonError(error);
  }
}
