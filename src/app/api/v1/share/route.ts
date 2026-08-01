import { z } from "zod";
import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { ValidationError } from "@/domain/shared/errors";
import { ROUTES } from "@/config/constants";
import { jsonCreated, jsonError } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";
import { getPublicEnv } from "@/config/env";

const bodySchema = z.object({
  type: z.enum(["PROFILE", "TWIN_CHAT", "KNOWLEDGE"]),
  targetId: z.string().optional().nullable(),
  label: z.string().trim().max(160).optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    getRateLimiter().consume(`share:${session.user.id}`);

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ValidationError("Invalid share payload");
    }

    const link = await container.social.createShareLink({
      ownerUserId: session.user.id,
      type: parsed.data.type,
      targetId: parsed.data.targetId,
      label: parsed.data.label,
    });

    const { appUrl } = getPublicEnv();
    return jsonCreated({
      share: {
        token: link.token,
        url: `${appUrl}${ROUTES.share(link.token)}`,
        type: link.type,
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
