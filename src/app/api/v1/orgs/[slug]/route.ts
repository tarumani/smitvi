import { z } from "zod";
import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { NotFoundError, ValidationError } from "@/domain/shared/errors";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";

const updateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(500).optional().nullable(),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const session = await requireSession();
    const { slug } = await context.params;
    const organization = await container.organizations.findBySlug(slug);
    if (!organization) throw new NotFoundError("Organization not found");

    const membership = await container.organizations.requireMembership(
      organization.id,
      session.user.id,
    );
    const members = await container.organizations.listMembers(organization.id);
    const invites = await container.organizations.listInvites(organization.id);

    return jsonOk({ organization, membership, members, invites });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const session = await requireSession();
    const { slug } = await context.params;
    const organization = await container.organizations.findBySlug(slug);
    if (!organization) throw new NotFoundError("Organization not found");

    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ValidationError("Invalid update payload");
    }

    const updated = await container.organizations.update(
      organization.id,
      session.user.id,
      parsed.data,
    );
    return jsonOk({ organization: updated });
  } catch (error) {
    return jsonError(error);
  }
}
