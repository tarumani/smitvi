import { normalizeReferrerUsername } from "@/lib/referral";
import { prisma } from "@/infrastructure/database/prisma";

export async function resolveReferrerUsername(
  raw: string | null | undefined,
  forUserId: string,
): Promise<string | null> {
  const username = normalizeReferrerUsername(raw);
  if (!username) return null;

  const referrer = await prisma.profile.findUnique({
    where: { username },
    select: { userId: true, username: true },
  });

  if (!referrer || referrer.userId === forUserId) return null;
  return referrer.username;
}
