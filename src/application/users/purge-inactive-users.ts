import {
  INACTIVE_BLOCK_AFTER_DAYS,
  INACTIVE_CLEANUP_BATCH_LIMIT,
  INACTIVE_DELETE_AFTER_BLOCK_DAYS,
  inactiveBlockCutoff,
  inactiveDeleteCutoff,
  isInactiveUserCleanupEnabled,
} from "@/config/inactive-users";
import { PRODUCTION_APP_URL, ROUTES } from "@/config/constants";
import { getSupabaseAdmin } from "@/infrastructure/auth/supabase/admin";
import { prisma } from "@/infrastructure/database/prisma";
import { sendTransactionalEmail } from "@/infrastructure/email/send-transactional-email";
import type { Prisma } from "@/generated/prisma/client";

export type PurgeInactiveUsersResult = {
  enabled: boolean;
  blocked: number;
  deleted: number;
  blockSkipped: number;
  deleteSkipped: number;
  blockCutoff: string;
  deleteCutoff: string;
};

/**
 * Abandoned empty FREE accounts only:
 * - no knowledge, no marketplace activity, no org ownership
 * - not staff, not admin-banned for other reasons without inactivity marker
 *
 * Active creators / paid plans are never auto-purged.
 */
export function abandonedEmptyAccountWhere(
  extras: Prisma.UserWhereInput[] = [],
): Prisma.UserWhereInput {
  return {
    deletedAt: null,
    plan: "FREE",
    role: { in: ["USER", "EXPERT"] },
    isBanned: false,
    knowledgeSources: { none: {} },
    marketplaceListings: { none: {} },
    marketplaceSales: { none: {} },
    marketplacePurchases: { none: {} },
    ownedOrganizations: { none: {} },
    AND: [
      {
        OR: [
          { profile: { is: null } },
          { profile: { isOnboarded: false } },
          {
            AND: [
              { profile: { isOnboarded: true } },
              { conversations: { none: {} } },
            ],
          },
        ],
      },
      ...extras,
    ],
  };
}

function appOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || PRODUCTION_APP_URL
  );
}

export class PurgeInactiveUsers {
  async execute(now = new Date()): Promise<PurgeInactiveUsersResult> {
    const blockCutoff = inactiveBlockCutoff(now);
    const deleteCutoff = inactiveDeleteCutoff(now);

    if (!isInactiveUserCleanupEnabled()) {
      return {
        enabled: false,
        blocked: 0,
        deleted: 0,
        blockSkipped: 0,
        deleteSkipped: 0,
        blockCutoff: blockCutoff.toISOString(),
        deleteCutoff: deleteCutoff.toISOString(),
      };
    }

    const blocked = await this.blockAbandoned(blockCutoff, now);
    const deleted = await this.deleteBlocked(deleteCutoff);

    return {
      enabled: true,
      blocked: blocked.blocked,
      deleted: deleted.deleted,
      blockSkipped: blocked.skipped,
      deleteSkipped: deleted.skipped,
      blockCutoff: blockCutoff.toISOString(),
      deleteCutoff: deleteCutoff.toISOString(),
    };
  }

  private async blockAbandoned(blockCutoff: Date, now: Date) {
    const candidates = await prisma.user.findMany({
      where: abandonedEmptyAccountWhere([
        { inactiveBlockedAt: null },
        { isActive: true },
        {
          OR: [
            { lastLoginAt: { lt: blockCutoff } },
            { lastLoginAt: null, createdAt: { lt: blockCutoff } },
          ],
        },
      ]),
      take: INACTIVE_CLEANUP_BATCH_LIMIT,
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        email: true,
        profile: { select: { displayName: true } },
      },
    });

    let blocked = 0;
    let skipped = 0;
    const loginUrl = `${appOrigin()}${ROUTES.login}`;

    for (const user of candidates) {
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            isActive: false,
            inactiveBlockedAt: now,
          },
        });

        const name = user.profile?.displayName || "there";
        await sendTransactionalEmail({
          to: user.email,
          subject: "Your Smitvi account is paused for inactivity",
          html: `<p>Hi ${name},</p>
<p>Your Smitvi account has been inactive for ${INACTIVE_BLOCK_AFTER_DAYS}+ days and looks unfinished, so access is paused.</p>
<p><strong>Sign in within ${INACTIVE_DELETE_AFTER_BLOCK_DAYS} days</strong> to reactivate. After that we permanently delete abandoned accounts and their data.</p>
<p><a href="${loginUrl}">Sign in to Smitvi</a></p>
<p>— Smitvi</p>`,
        });

        blocked += 1;
      } catch (error) {
        console.error("[inactive-cleanup] block failed", user.id, error);
        skipped += 1;
      }
    }

    return { blocked, skipped };
  }

  private async deleteBlocked(deleteCutoff: Date) {
    const candidates = await prisma.user.findMany({
      where: abandonedEmptyAccountWhere([
        { inactiveBlockedAt: { not: null, lt: deleteCutoff } },
        { isActive: false },
      ]),
      take: INACTIVE_CLEANUP_BATCH_LIMIT,
      orderBy: { inactiveBlockedAt: "asc" },
      select: {
        id: true,
        email: true,
        profile: { select: { displayName: true } },
      },
    });

    let deleted = 0;
    let skipped = 0;
    const supabase = getSupabaseAdmin();

    for (const user of candidates) {
      try {
        const { error: authError } = await supabase.auth.admin.deleteUser(
          user.id,
        );
        if (
          authError &&
          !/not (found|exist)|user not found/i.test(authError.message)
        ) {
          throw new Error(authError.message);
        }

        await prisma.user.delete({ where: { id: user.id } });

        const name = user.profile?.displayName || "there";
        await sendTransactionalEmail({
          to: user.email,
          subject: "Your Smitvi account was deleted",
          html: `<p>Hi ${name},</p>
<p>Your paused Smitvi account was permanently deleted after ${INACTIVE_DELETE_AFTER_BLOCK_DAYS} days without sign-in.</p>
<p>You can create a new account anytime at <a href="${appOrigin()}">${appOrigin()}</a>.</p>
<p>— Smitvi</p>`,
        });

        deleted += 1;
      } catch (error) {
        console.error("[inactive-cleanup] delete failed", user.id, error);
        skipped += 1;
      }
    }

    return { deleted, skipped };
  }
}
