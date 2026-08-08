import { z } from "zod";
import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { ValidationError } from "@/domain/shared/errors";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";

const schema = z.object({
  listingId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  body: z.string().max(2000).optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body: unknown = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) throw new ValidationError("Invalid review");

    const review = await container.reviews.create({
      userId: session.user.id,
      listingId: parsed.data.listingId,
      rating: parsed.data.rating,
      body: parsed.data.body,
    });

    return jsonOk({ review });
  } catch (error) {
    return jsonError(error);
  }
}
