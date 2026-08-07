import { ROUTES } from "@/config/constants";
import { prisma } from "@/infrastructure/database/prisma";
import { sendTransactionalEmail } from "@/infrastructure/email/send-transactional-email";
import { appOrigin } from "@/lib/public-hub-url";

/** Wait after Twin is READY before suggesting a listing (avoid same-day spam). */
const MIN_TWIN_READY_AGE_MS = 24 * 60 * 60 * 1000;
const BATCH_LIMIT = 40;

export type SendListingNudgesResult = {
  scanned: number;
  sent: number;
  skipped: number;
};

export class SendListingNudges {
  async execute(): Promise<SendListingNudgesResult> {
    const readyBefore = new Date(Date.now() - MIN_TWIN_READY_AGE_MS);

    const candidates = await prisma.profile.findMany({
      where: {
        isOnboarded: true,
        listingNudgeSentAt: null,
        user: {
          deletedAt: null,
          knowledgeSources: {
            some: {
              status: "READY",
              updatedAt: { lt: readyBefore },
            },
          },
          marketplaceListings: { none: { status: "ACTIVE" } },
        },
      },
      take: BATCH_LIMIT,
      select: {
        id: true,
        displayName: true,
        user: { select: { email: true } },
      },
    });

    let sent = 0;
    let skipped = 0;

    const sellUrl = `${appOrigin()}${ROUTES.marketplaceSellFirst}`;

    for (const profile of candidates) {
      const email = profile.user.email;
      if (!email) {
        skipped += 1;
        continue;
      }

      const name = profile.displayName || "there";

      const result = await sendTransactionalEmail({
        to: email,
        subject: "Your Twin is live — publish your first offer",
        html: `<p>Hi ${name},</p>
<p>Your AI Twin is trained and visitors can chat on your hub. The next step to earn on Smitvi is a <strong>marketplace listing</strong> — a knowledge pack, template, or service buyers can purchase.</p>
<p><a href="${sellUrl}">Create your first listing</a> (guided setup, about 5 minutes).</p>
<p>— Smitvi</p>`,
      });

      if (!result.ok) {
        skipped += 1;
        continue;
      }

      await prisma.profile.update({
        where: { id: profile.id },
        data: { listingNudgeSentAt: new Date() },
      });
      sent += 1;
    }

    return { scanned: candidates.length, sent, skipped };
  }
}
