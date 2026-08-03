import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { NotFoundError, ValidationError } from "@/domain/shared/errors";
import type { ConsultationRequestStatus } from "@/generated/prisma/client";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";

const STATUSES: ConsultationRequestStatus[] = [
  "PENDING",
  "ACCEPTED",
  "DECLINED",
  "CANCELED",
  "COMPLETED",
];

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    const { id } = await context.params;
    const body = (await request.json()) as { status?: string };

    if (!body.status || !STATUSES.includes(body.status as ConsultationRequestStatus)) {
      throw new ValidationError("Invalid status");
    }

    const updated = await container.consultations.updateRequestStatus(
      id,
      session.user.id,
      body.status as ConsultationRequestStatus,
    );
    if (!updated) {
      throw new NotFoundError("Consultation request not found");
    }

    await container.auditLogs.create({
      actorId: session.user.id,
      action: "CONSULTATION_REQUEST_UPDATED",
      entityType: "consultation_request",
      entityId: updated.id,
      metadata: { status: updated.status },
    });

    return jsonOk({ request: updated });
  } catch (error) {
    return jsonError(error);
  }
}
