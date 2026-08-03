import { getCurrentSession, requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { NotFoundError, ValidationError } from "@/domain/shared/errors";
import { jsonCreated, jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";

export async function GET() {
  try {
    const session = await requireSession();
    const requests = await container.consultations.listRequestsForExpert(
      session.user.id,
    );
    return jsonOk({ requests });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      username?: string;
      requesterName?: string;
      requesterEmail?: string;
      message?: string;
      preferredAt?: string | null;
    };

    const username = body.username?.trim().toLowerCase();
    if (!username) {
      throw new ValidationError("Expert username is required");
    }

    const name = body.requesterName?.trim() ?? "";
    const email = body.requesterEmail?.trim().toLowerCase() ?? "";
    if (name.length < 2) {
      throw new ValidationError("Your name is required");
    }
    if (!email.includes("@")) {
      throw new ValidationError("A valid email is required");
    }

    const profile = await container.profiles.findByUsername(username);
    if (!profile || profile.visibility === "PRIVATE") {
      throw new NotFoundError("Expert not found");
    }

    const offer = await container.consultations.getEnabledOfferByUserId(
      profile.userId,
    );
    if (!offer) {
      throw new ValidationError("This expert is not accepting consultations");
    }

    getRateLimiter().consume(`consultation:request:${email}:${profile.userId}`);

    const session = await getCurrentSession();
    let preferredAt: Date | null = null;
    if (body.preferredAt) {
      const parsed = new Date(body.preferredAt);
      if (Number.isNaN(parsed.getTime())) {
        throw new ValidationError("Preferred time is invalid");
      }
      preferredAt = parsed;
    }

    const created = await container.consultations.createRequest({
      offerId: offer.id,
      expertUserId: profile.userId,
      requesterUserId: session?.user.id ?? null,
      requesterName: name,
      requesterEmail: email,
      message: body.message?.trim() || null,
      preferredAt,
    });

    await container.auditLogs.create({
      actorId: session?.user.id ?? null,
      action: "CONSULTATION_REQUESTED",
      entityType: "consultation_request",
      entityId: created.id,
      metadata: { expertUserId: profile.userId },
    });

    return jsonCreated({ request: created });
  } catch (error) {
    return jsonError(error);
  }
}
