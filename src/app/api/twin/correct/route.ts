import { z } from "zod";
import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { ValidationError } from "@/domain/shared/errors";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";

const schema = z.object({
  relationshipId: z.string().uuid(),
  verificationStatus: z.enum([
    "USER_VERIFIED",
    "USER_REJECTED",
    "HIDDEN",
  ]),
});

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body: unknown = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) throw new ValidationError("Invalid correction");

    await container.graph.updateRelationshipVerification(
      parsed.data.relationshipId,
      session.user.id,
      parsed.data.verificationStatus,
    );

    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
