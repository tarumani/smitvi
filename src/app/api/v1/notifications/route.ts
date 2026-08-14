import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";
import { prisma } from "@/infrastructure/database/prisma";

type NotificationDto = {
  id: string;
  type:
    | "TWIN_INBOX"
    | "FOLLOW"
    | "REVIEW"
    | "CONSULTATION_REQUEST"
    | "MARKETPLACE_SALE"
    | "MARKETPLACE_PURCHASE"
    | "WEEKLY_REPORT"
    | "PROFILE_VALUE";
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  conversationId?: string;
  hubUsername?: string;
  requestId?: string;
  orderId?: string;
  activityKey?: string;
  href?: string;
  visitor?: {
    userId: string;
    displayName: string | null;
    username: string | null;
  };
};

export async function GET() {
  try {
    const session = await requireSession();
    getRateLimiter().consume(`notifications:list:${session.user.id}`);

    const userId = session.user.id;

    const [
      inbox,
      followers,
      reviews,
      readAtByConversation,
      socialReadKeys,
      consultationRequests,
      pendingConsultations,
      paidSales,
      paidPurchases,
    ] = await Promise.all([
      container.conversations.listInboxForOwner(userId),
      container.social.listRecentFollowers(userId, 12),
      container.social.listReviews(userId, 12),
      container.twinInboxReads.getReadAtByConversation(userId),
      container.socialActivityReads.getReadKeys(userId),
      container.consultations.listRequestsForExpert(userId),
      container.consultations.countPendingForExpert(userId),
      container.marketplace.listRecentPaidSellerOrders(userId, 12),
      container.marketplace.listRecentPaidBuyerOrders(userId, 12),
    ]);

    const twinItems: NotificationDto[] = inbox.map((item) => {
      const visitorName =
        item.visitor.displayName ??
        (item.visitor.username ? `@${item.visitor.username}` : item.visitor.email);
      const preview = item.lastMessage?.content.replace(/\s+/g, " ").trim() ?? "";
      const read = container.twinInboxReads.isConversationRead(
        item.id,
        item.updatedAt,
        readAtByConversation,
      );
      return {
        id: `twin:${item.id}`,
        type: "TWIN_INBOX",
        title: "Twin question",
        body:
          preview.length > 0
            ? `${visitorName}: ${preview.length > 140 ? `${preview.slice(0, 137)}…` : preview}`
            : `${visitorName} started a conversation`,
        createdAt: item.updatedAt.toISOString(),
        read,
        conversationId: item.id,
        visitor: {
          userId: item.visitor.userId,
          displayName: item.visitor.displayName,
          username: item.visitor.username,
        },
      };
    });

    const followItems: NotificationDto[] = followers.map((f) => {
      const activityKey = `follow:${f.id}`;
      return {
        id: activityKey,
        type: "FOLLOW" as const,
        title: "New follower",
        body: `${f.displayName} (@${f.username}) followed your hub`,
        createdAt: f.createdAt.toISOString(),
        read: container.socialActivityReads.isRead(activityKey, socialReadKeys),
        hubUsername: f.username,
        activityKey,
      };
    });

    const reviewItems: NotificationDto[] = reviews.map((r) => {
      const activityKey = `review:${r.id}`;
      return {
        id: activityKey,
        type: "REVIEW" as const,
        title: "New review",
        body: `${r.reviewerName} left ${r.rating}★${
          r.comment ? `: ${r.comment.slice(0, 100)}` : ""
        }`,
        createdAt: r.createdAt.toISOString(),
        read: container.socialActivityReads.isRead(activityKey, socialReadKeys),
        hubUsername: r.reviewerUsername,
        activityKey,
      };
    });

    const consultationItems: NotificationDto[] = consultationRequests
      .slice(0, 12)
      .map((r) => {
        const preview = (r.message ?? "").replace(/\s+/g, " ").trim();
        const detail =
          preview.length > 0
            ? preview.length > 120
              ? `${preview.slice(0, 117)}…`
              : preview
            : r.requesterEmail;
        return {
          id: `consultation:${r.id}`,
          type: "CONSULTATION_REQUEST" as const,
          title: "Consultation request",
          body: `${r.requesterName}: ${detail}`,
          createdAt: r.createdAt.toISOString(),
          read: r.status !== "PENDING",
          requestId: r.id,
        };
      });

    const saleItems: NotificationDto[] = paidSales.map((order) => {
      const activityKey = `sale:${order.id}`;
      const buyerName =
        order.buyer.profile?.displayName ??
        (order.buyer.profile?.username
          ? `@${order.buyer.profile.username}`
          : "A buyer");
      const title = order.listing.title;
      const shortTitle =
        title.length > 50 ? `${title.slice(0, 47)}…` : title;
      const net = `${(order.netAmountCents / 100).toFixed(2)} ${order.currency}`;
      const when = order.paidAt ?? order.createdAt;
      return {
        id: activityKey,
        type: "MARKETPLACE_SALE" as const,
        title: "Marketplace sale",
        body: `${buyerName} bought “${shortTitle}” · net ${net}`,
        createdAt: when.toISOString(),
        read: container.socialActivityReads.isRead(activityKey, socialReadKeys),
        orderId: order.id,
        activityKey,
      };
    });

    const purchaseItems: NotificationDto[] = paidPurchases.map((order) => {
      const activityKey = `purchase:${order.id}`;
      const sellerName =
        order.seller.profile?.displayName ??
        (order.seller.profile?.username
          ? `@${order.seller.profile.username}`
          : "Seller");
      const title = order.listing.title;
      const shortTitle =
        title.length > 50 ? `${title.slice(0, 47)}…` : title;
      const gross = `${(order.grossAmountCents / 100).toFixed(2)} ${order.currency}`;
      const when = order.paidAt ?? order.createdAt;
      return {
        id: activityKey,
        type: "MARKETPLACE_PURCHASE" as const,
        title: "Purchase confirmed",
        body: `You bought “${shortTitle}” from ${sellerName} · ${gross}`,
        createdAt: when.toISOString(),
        read: container.socialActivityReads.isRead(activityKey, socialReadKeys),
        orderId: order.id,
        activityKey,
      };
    });

    const [weekly, pendingAction] = await Promise.all([
      prisma.weeklyIntelligenceReport.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.nextBestAction.findFirst({
        where: { userId, status: "PENDING" },
        orderBy: { priority: "desc" },
      }),
    ]);

    const intelligenceItems: NotificationDto[] = [];
    if (weekly) {
      intelligenceItems.push({
        id: `weekly:${weekly.id}`,
        type: "WEEKLY_REPORT",
        title: "Your weekly Intelligence Report is ready",
        body: weekly.summary,
        createdAt: weekly.createdAt.toISOString(),
        read: false,
        href: "/hub/today",
      });
    }
    if (pendingAction) {
      intelligenceItems.push({
        id: `nba:${pendingAction.id}`,
        type: "PROFILE_VALUE",
        title: pendingAction.title,
        body: pendingAction.description,
        createdAt: pendingAction.generatedAt.toISOString(),
        read: false,
        href: "/hub/today",
      });
    }

    const notifications = [
      ...twinItems,
      ...followItems,
      ...reviewItems,
      ...consultationItems,
      ...saleItems,
      ...purchaseItems,
      ...intelligenceItems,
    ]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 40);

    const unreadCount =
      twinItems.filter((n) => !n.read).length +
      intelligenceItems.filter((n) => !n.read).length;
    const socialUnreadCount =
      followItems.filter((n) => !n.read).length +
      reviewItems.filter((n) => !n.read).length +
      saleItems.filter((n) => !n.read).length +
      purchaseItems.filter((n) => !n.read).length;

    return jsonOk({
      notifications,
      unreadCount,
      socialUnreadCount,
      pendingConsultationCount: pendingConsultations,
    });
  } catch (error) {
    return jsonError(error);
  }
}
