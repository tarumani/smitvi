import { prisma } from "@/infrastructure/database/prisma";

export function normalizeEmail(email: string | null | undefined): string | null {
  if (!email?.trim()) return null;
  return email.trim().toLowerCase();
}

export function normalizeProspectUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  try {
    const u = new URL(url.trim());
    u.hash = "";
    return u.toString().replace(/\/$/, "").toLowerCase();
  } catch {
    return url.trim().toLowerCase();
  }
}

export class GrowthSuppressionService {
  async isSuppressed(input: {
    email?: string | null;
    url?: string | null;
  }): Promise<boolean> {
    const email = normalizeEmail(input.email);
    const url = normalizeProspectUrl(input.url);
    if (!email && !url) return false;

    const or: Array<{ email?: string; url?: string }> = [];
    if (email) or.push({ email });
    if (url) or.push({ url });

    const hit = await prisma.growthSuppressionEntry.findFirst({
      where: { OR: or },
    });
    return Boolean(hit);
  }

  async addEntry(input: {
    email?: string | null;
    url?: string | null;
    reason?: string | null;
  }): Promise<void> {
    await prisma.growthSuppressionEntry.create({
      data: {
        email: normalizeEmail(input.email),
        url: normalizeProspectUrl(input.url),
        reason: input.reason?.slice(0, 240) ?? null,
      },
    });
  }
}
