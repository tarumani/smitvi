import { BUSINESS_ORG_SEAT_LIMIT } from "@/config/constants";
import { getEntitlements } from "@/domain/billing/entitlements";
import { ForbiddenError, UnauthorizedError } from "@/domain/shared/errors";
import type { UserPlan } from "@/domain/user/entities";
import { PrismaAuditLogRepository } from "@/infrastructure/database/repositories/audit-repository";
import type { PrismaOrganizationRepository } from "@/infrastructure/database/repositories/organization-repository";

export class CreateOrganization {
  constructor(
    private readonly organizations: PrismaOrganizationRepository,
    private readonly auditLogs = new PrismaAuditLogRepository(),
  ) {}

  async execute(input: {
    userId: string | null | undefined;
    plan: UserPlan;
    name: string;
    slug: string;
    description?: string | null;
  }) {
    if (!input.userId) throw new UnauthorizedError();

    const entitlements = getEntitlements(input.plan);
    if (!entitlements.businessWorkspace) {
      throw new ForbiddenError(
        "Company workspaces require a Business plan. Upgrade to create an organization.",
      );
    }

    const org = await this.organizations.create({
      name: input.name,
      slug: input.slug,
      description: input.description,
      ownerUserId: input.userId,
      seatLimit: BUSINESS_ORG_SEAT_LIMIT,
    });

    await this.auditLogs.create({
      actorId: input.userId,
      action: "ORGANIZATION_CREATED",
      entityType: "organization",
      entityId: org.id,
      metadata: { slug: org.slug },
    });

    return org;
  }
}
