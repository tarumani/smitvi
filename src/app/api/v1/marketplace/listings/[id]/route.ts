import { z } from "zod";
import { getCurrentSession, requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { NotFoundError, ValidationError } from "@/domain/shared/errors";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";

const updateSchema = z.object({
  type: z
    .enum([
      "CONSULTATION",
      "KNOWLEDGE_PACK",
      "EXPERT_SUBSCRIPTION",
      "SERVICE_PACKAGE",
      "TEMPLATE",
      "PROMPT_PACK",
    ])
    .optional(),
  title: z.string().trim().min(3).max(160).optional(),
  description: z.string().trim().min(10).max(2000).optional(),
  currency: z.string().trim().length(3).optional(),
  priceCents: z.number().int().min(100).optional(),
  durationMinutes: z.number().int().min(15).max(480).optional().nullable(),
  status: z.enum(["DRAFT", "ACTIVE", "PAUSED"]).optional(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const listing = await container.marketplace.findListing(id);
    if (!listing || listing.status === "ARCHIVED") {
      throw new NotFoundError("Listing not found");
    }

    if (listing.status !== "ACTIVE") {
      const session = await getCurrentSession();
      if (session?.user.id !== listing.sellerId) {
        throw new NotFoundError("Listing not found");
      }
    }

    return jsonOk({ listing });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await context.params;
    getRateLimiter().consume(`marketplace:update:${session.user.id}`);

    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ValidationError("Invalid listing payload");
    }
    if (Object.keys(parsed.data).length === 0) {
      throw new ValidationError("No fields to update");
    }

    const { status, ...fields } = parsed.data;
    let listing = null;

    if (Object.keys(fields).length > 0) {
      listing = await container.marketplace.updateListing(
        id,
        session.user.id,
        fields,
      );
    }

    if (status !== undefined) {
      listing = await container.marketplace.updateListingStatus(
        id,
        session.user.id,
        status,
      );
    }

    if (!listing) {
      throw new ValidationError("No fields to update");
    }

    return jsonOk({ listing });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await context.params;
    getRateLimiter().consume(`marketplace:delete:${session.user.id}`);

    const listing = await container.marketplace.archiveListing(
      id,
      session.user.id,
    );

    return jsonOk({ listing });
  } catch (error) {
    return jsonError(error);
  }
}
