import { container } from "@/application/container";
import { prisma } from "@/infrastructure/database/prisma";
import { NotFoundError } from "@/domain/shared/errors";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";
import { getClientIp } from "@/infrastructure/http/respond";

type Params = { params: Promise<{ userId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const ip = getClientIp(_request) ?? "anon";
    getRateLimiter().consume(`search:similar:${ip}`);
    const { userId } = await params;

    const profile = await prisma.profile.findFirst({
      where: {
        OR: [{ userId }, { username: userId }],
        visibility: "PUBLIC",
      },
    });
    if (!profile) throw new NotFoundError("Expert not found");

    const experts = await container.unifiedSearch.similarExperts(profile.userId);
    return jsonOk({ experts, sourceUsername: profile.username });
  } catch (error) {
    return jsonError(error);
  }
}
