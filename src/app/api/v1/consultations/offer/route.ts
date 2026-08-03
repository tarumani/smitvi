import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { ValidationError } from "@/domain/shared/errors";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";

export async function GET() {
  try {
    const session = await requireSession();
    const offer = await container.consultations.getOfferByUserId(session.user.id);
    return jsonOk({
      offer: offer ?? {
        enabled: false,
        headline: null,
        description: null,
        durationMinutes: 30,
        priceCents: 0,
        currency: "USD",
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const session = await requireSession();
    const body = (await request.json()) as {
      enabled?: boolean;
      headline?: string | null;
      description?: string | null;
      durationMinutes?: number;
      priceCents?: number;
      currency?: string;
    };

    const durationMinutes = Number(body.durationMinutes ?? 30);
    const priceCents = Number(body.priceCents ?? 0);
    const currency = (body.currency ?? "USD").trim().toUpperCase();

    if (
      !Number.isFinite(durationMinutes) ||
      durationMinutes < 15 ||
      durationMinutes > 240
    ) {
      throw new ValidationError("Duration must be between 15 and 240 minutes");
    }
    if (!Number.isFinite(priceCents) || priceCents < 0 || priceCents > 10_000_000) {
      throw new ValidationError("Price is invalid");
    }
    if (!/^[A-Z]{3}$/.test(currency)) {
      throw new ValidationError("Currency must be a 3-letter code");
    }

    const offer = await container.consultations.upsertOffer(session.user.id, {
      enabled: Boolean(body.enabled),
      headline: body.headline?.trim() || null,
      description: body.description?.trim() || null,
      durationMinutes: Math.round(durationMinutes),
      priceCents: Math.round(priceCents),
      currency,
    });

    await container.auditLogs.create({
      actorId: session.user.id,
      action: "CONSULTATION_OFFER_UPDATED",
      entityType: "consultation_offer",
      entityId: offer.id,
      metadata: { enabled: offer.enabled },
    });

    return jsonOk({ offer });
  } catch (error) {
    return jsonError(error);
  }
}
