import { z } from "zod";
import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { ValidationError } from "@/domain/shared/errors";
import { jsonCreated, jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";

const createSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(3).max(40),
  description: z.string().trim().max(500).optional().nullable(),
});

export async function GET() {
  try {
    const session = await requireSession();
    const orgs = await container.organizations.listForUser(session.user.id);
    return jsonOk({ organizations: orgs });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    getRateLimiter().consume(`orgs:create:${session.user.id}`);

    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ValidationError("Invalid organization payload");
    }

    const organization = await container.createOrganization.execute({
      userId: session.user.id,
      plan: session.user.plan,
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description,
    });

    return jsonCreated({ organization });
  } catch (error) {
    return jsonError(error);
  }
}
