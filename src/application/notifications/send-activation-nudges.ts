import { PRODUCTION_APP_URL, ROUTES, TRAIN_TWIN_LABEL } from "@/config/constants";
import { prisma } from "@/infrastructure/database/prisma";
import { sendTransactionalEmail } from "@/infrastructure/email/send-transactional-email";

const MIN_ACCOUNT_AGE_MS = 24 * 60 * 60 * 1000;
const BATCH_LIMIT = 40;

function appOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || PRODUCTION_APP_URL
  );
}

export type SendActivationNudgesResult = {
  scanned: number;
  sent: number;
  skipped: number;
};

export class SendActivationNudges {
  async execute(): Promise<SendActivationNudgesResult> {
    const cutoff = new Date(Date.now() - MIN_ACCOUNT_AGE_MS);

    const candidates = await prisma.profile.findMany({
      where: {
        isOnboarded: true,
        activationNudgeSentAt: null,
        createdAt: { lt: cutoff },
        user: {
          deletedAt: null,
          knowledgeSources: { none: {} },
        },
      },
      take: BATCH_LIMIT,
      select: {
        id: true,
        userId: true,
        displayName: true,
        user: { select: { email: true } },
      },
    });

    let sent = 0;
    let skipped = 0;

    for (const profile of candidates) {
      const email = profile.user.email;
      if (!email) {
        skipped += 1;
        continue;
      }

      const trainUrl = `${appOrigin()}${ROUTES.hub.intelligence}`;
      const name = profile.displayName || "there";

      const result = await sendTransactionalEmail({
        to: email,
        subject: `${TRAIN_TWIN_LABEL} — wake your public Twin`,
        html: `<p>Hi ${name},</p>
<p>Your Smitvi profile is live, but your AI Twin is not trained yet. Upload one document or paste a link — visitors cannot get answers until you do.</p>
<p><a href="${trainUrl}">${TRAIN_TWIN_LABEL}</a></p>
<p>— Smitvi</p>`,
      });

      if (!result.ok) {
        skipped += 1;
        continue;
      }

      await prisma.profile.update({
        where: { id: profile.id },
        data: { activationNudgeSentAt: new Date() },
      });
      sent += 1;
    }

    return { scanned: candidates.length, sent, skipped };
  }
}
