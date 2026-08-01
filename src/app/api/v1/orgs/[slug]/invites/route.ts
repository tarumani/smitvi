import { z } from "zod";
import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { NotFoundError, ValidationError } from "@/domain/shared/errors";
import { getPublicEnv } from "@/config/env";
import { ROUTES } from "@/config/constants";
import { jsonCreated, jsonError } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";
import { PrismaAuditLogRepository } from "@/infrastructure/database/repositories/audit-repository";

const inviteSchema = z.object({
  email: z.string().trim().email().max(320),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const session = await requireSession();
    getRateLimiter().consume(`orgs:invite:${session.user.id}`);

    const { slug } = await context.params;
    const organization = await container.organizations.findBySlug(slug);
    if (!organization) throw new NotFoundError("Organization not found");

    const parsed = inviteSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ValidationError("Invalid invite payload");
    }

    const invite = await container.organizations.createInvite({
      organizationId: organization.id,
      actorUserId: session.user.id,
      email: parsed.data.email,
      role: parsed.data.role,
    });

    await new PrismaAuditLogRepository().create({
      actorId: session.user.id,
      action: "ORGANIZATION_MEMBER_INVITED",
      entityType: "organization",
      entityId: organization.id,
      metadata: { email: invite.email, role: invite.role },
    });

    const { appUrl } = getPublicEnv();
    return jsonCreated({
      invite,
      inviteUrl: `${appUrl}${ROUTES.organizationInvite(invite.token)}`,
    });
  } catch (error) {
    return jsonError(error);
  }
}
