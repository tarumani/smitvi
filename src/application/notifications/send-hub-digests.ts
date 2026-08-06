import { PRODUCTION_APP_URL, ROUTES } from "@/config/constants";
import type { FollowingFeedItem } from "@/infrastructure/database/repositories/following-feed-repository";
import { PrismaFollowingFeedRepository } from "@/infrastructure/database/repositories/following-feed-repository";
import { prisma } from "@/infrastructure/database/prisma";
import { sendTransactionalEmail } from "@/infrastructure/email/send-transactional-email";

const DIGEST_QUIET_HOURS_MS = 20 * 60 * 60 * 1000;
const LOOKBACK_MS = 7 * 24 * 60 * 60 * 1000;

function appOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || PRODUCTION_APP_URL
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatFeedHtml(items: FollowingFeedItem[]): string {
  const rows = items
    .map((item) => {
      const href = `${appOrigin()}${ROUTES.publicProfile(item.expert.username)}#hub-tab-activity`;
      const label = item.kind === "knowledge" ? "Knowledge" : "Offer";
      return `<li style="margin:0 0 12px"><strong>${label}</strong> · @${item.expert.username}<br/><a href="${href}">${escapeHtml(item.title)}</a></li>`;
    })
    .join("");

  return `<ul style="padding-left:18px;margin:0">${rows}</ul>`;
}

export type SendHubDigestsResult = {
  scanned: number;
  sent: number;
  skipped: number;
};

export class SendHubDigests {
  constructor(
    private readonly feed: PrismaFollowingFeedRepository = new PrismaFollowingFeedRepository(),
  ) {}

  async execute(): Promise<SendHubDigestsResult> {
    const now = Date.now();
    const defaultSince = new Date(now - LOOKBACK_MS);

    const subscribers = await prisma.user.findMany({
      where: {
        emailVerified: true,
        isActive: true,
        isBanned: false,
        profile: {
          is: {
            hubDigestEmailEnabled: true,
            visibility: { not: "PRIVATE" },
          },
        },
      },
      select: {
        id: true,
        email: true,
        profile: {
          select: {
            displayName: true,
            hubDigestLastSentAt: true,
          },
        },
      },
      take: 500,
    });

    let sent = 0;
    let skipped = 0;

    for (const user of subscribers) {
      if (!user.profile) {
        skipped += 1;
        continue;
      }

      const lastSent = user.profile.hubDigestLastSentAt;
      if (lastSent && now - lastSent.getTime() < DIGEST_QUIET_HOURS_MS) {
        skipped += 1;
        continue;
      }

      const since =
        lastSent && lastSent.getTime() > defaultSince.getTime()
          ? lastSent
          : defaultSince;

      const items = await this.feed.listForFollowerSince(user.id, since, 10);
      if (items.length === 0) {
        skipped += 1;
        continue;
      }

      const discoverUrl = `${appOrigin()}${ROUTES.discover}`;
      const html = `
        <p>Hi ${escapeHtml(user.profile.displayName)},</p>
        <p>Here’s what changed on hubs you follow:</p>
        ${formatFeedHtml(items)}
        <p><a href="${discoverUrl}">Open Discover</a></p>
      `;

      const result = await sendTransactionalEmail({
        to: user.email,
        subject: "Updates from hubs you follow on Smitvi",
        html,
      });

      if (!result.ok) {
        skipped += 1;
        continue;
      }

      await prisma.profile.update({
        where: { userId: user.id },
        data: { hubDigestLastSentAt: new Date() },
      });
      sent += 1;
    }

    return { scanned: subscribers.length, sent, skipped };
  }
}
