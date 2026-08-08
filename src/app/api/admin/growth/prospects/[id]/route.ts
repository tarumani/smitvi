import { requireAdmin } from "@/application/auth/require-admin";
import { container } from "@/application/container";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const prospect = await container.growthProspects.getById(id);
    return jsonOk({ prospect });
  } catch (e) {
    return jsonError(e);
  }
}
