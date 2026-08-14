import { prisma } from "@/infrastructure/database/prisma";
import {
  canSendReengagement,
  classifyActivitySegment,
  reengagementCopy,
} from "@/domain/intelligence/activity-segment";
import { sendTransactionalEmail } from "@/infrastructure/email/send-transactional-email";
import { PRODUCTION_APP_URL, ROUTES } from "@/config/constants";

export class ReengagementService {
  async execute(limit = 40) {
    const cutoff = new Date(Date.now() - 14 * 86400000);
    const profiles = await prisma.profile.findMany({
      where: {
        isOnboarded: true,
        user: { deletedAt: null, isBanned: false },
        OR: [
          { lastMeaningfulActivityAt: { lt: cutoff } },
          { lastMeaningfulActivityAt: null },
        ],
      },
      take: limit,
      select: {
        userId: true,
        displayName: true,
        intelligenceReadinessScore: true,
        lastMeaningfulActivityAt: true,
        lastReengagementNotifiedAt: true,
        portfolio: { select: { id: true }, take: 1 },
        user: {
          select: {
            email: true,
            knowledgeSources: { select: { id: true }, take: 1 },
          },
        },
      },
    });

    let sent = 0;
    let skipped = 0;
    const now = new Date();

    for (const profile of profiles) {
      const segment = classifyActivitySegment(
        profile.lastMeaningfulActivityAt,
        now,
      );
      if (
        !canSendReengagement(profile.lastReengagementNotifiedAt, segment, now)
      ) {
        skipped += 1;
        continue;
      }
      const copy = reengagementCopy({
        missingProject: profile.portfolio.length === 0,
        missingKnowledge: profile.user.knowledgeSources.length === 0,
        readinessScore: profile.intelligenceReadinessScore,
      });
      const result = await sendTransactionalEmail({
        to: profile.user.email,
        subject: copy.subject,
        html: `<p>${copy.body}</p><p><a href="${PRODUCTION_APP_URL}${ROUTES.hub.today}">Open Your Intelligence Today</a></p>`,
      });
      if (result.ok) {
        sent += 1;
        await prisma.profile.update({
          where: { userId: profile.userId },
          data: { lastReengagementNotifiedAt: now },
        });
      } else {
        skipped += 1;
      }
    }

    return { scanned: profiles.length, sent, skipped };
  }
}
