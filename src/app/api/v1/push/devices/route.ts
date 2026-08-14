import { z } from "zod";
import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { ValidationError } from "@/domain/shared/errors";
import { jsonCreated, jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";

const registerSchema = z.object({
  expoPushToken: z.string().trim().min(10).max(512),
  platform: z.enum(["ios", "android", "web"]).optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    getRateLimiter().consume(`push:register:${session.user.id}`);

    const parsed = registerSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ValidationError("Invalid push device payload");
    }

    const device = await container.pushDevices.upsert({
      userId: session.user.id,
      expoPushToken: parsed.data.expoPushToken,
      platform: parsed.data.platform ?? null,
    });

    return jsonCreated({
      device: {
        id: device.id,
        platform: device.platform,
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireSession();
    getRateLimiter().consume(`push:revoke:${session.user.id}`);

    const parsed = registerSchema.pick({ expoPushToken: true }).safeParse(
      await request.json(),
    );
    if (!parsed.success) {
      throw new ValidationError("Invalid push device payload");
    }

    const removed = await container.pushDevices.revoke(
      session.user.id,
      parsed.data.expoPushToken,
    );

    return jsonOk({ removed });
  } catch (error) {
    return jsonError(error);
  }
}
