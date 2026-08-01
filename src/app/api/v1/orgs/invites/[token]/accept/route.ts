import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { PrismaAuditLogRepository } from "@/infrastructure/database/repositories/audit-repository";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";

export async function POST(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  try {
    const session = await requireSession();
    getRateLimiter().consume(`orgs:accept:${session.user.id}`);
    const { token } = await context.params;

    const organization = await container.organizations.acceptInvite(
      token,
      session.user.id,
      session.email,
    );

    await new PrismaAuditLogRepository().create({
      actorId: session.user.id,
      action: "ORGANIZATION_MEMBER_JOINED",
      entityType: "organization",
      entityId: organization.id,
      metadata: { slug: organization.slug },
    });

    return jsonOk({ organization });
  } catch (error) {
    return jsonError(error);
  }
}
