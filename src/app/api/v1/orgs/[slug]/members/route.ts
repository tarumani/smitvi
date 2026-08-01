import { z } from "zod";
import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { NotFoundError, ValidationError } from "@/domain/shared/errors";
import { PrismaAuditLogRepository } from "@/infrastructure/database/repositories/audit-repository";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";

const patchSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["ADMIN", "MEMBER"]).optional(),
  remove: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const session = await requireSession();
    const { slug } = await context.params;
    const organization = await container.organizations.findBySlug(slug);
    if (!organization) throw new NotFoundError("Organization not found");

    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ValidationError("Invalid member update");
    }

    if (parsed.data.remove) {
      await container.organizations.removeMember({
        organizationId: organization.id,
        actorUserId: session.user.id,
        targetUserId: parsed.data.userId,
      });
      await new PrismaAuditLogRepository().create({
        actorId: session.user.id,
        action: "ORGANIZATION_MEMBER_REMOVED",
        entityType: "organization",
        entityId: organization.id,
        metadata: { userId: parsed.data.userId },
      });
      return jsonOk({ removed: true });
    }

    if (!parsed.data.role) {
      throw new ValidationError("role or remove is required");
    }

    await container.organizations.updateMemberRole({
      organizationId: organization.id,
      actorUserId: session.user.id,
      targetUserId: parsed.data.userId,
      role: parsed.data.role,
    });
    await new PrismaAuditLogRepository().create({
      actorId: session.user.id,
      action: "ORGANIZATION_MEMBER_ROLE_CHANGED",
      entityType: "organization",
      entityId: organization.id,
      metadata: { userId: parsed.data.userId, role: parsed.data.role },
    });

    return jsonOk({ updated: true });
  } catch (error) {
    return jsonError(error);
  }
}
