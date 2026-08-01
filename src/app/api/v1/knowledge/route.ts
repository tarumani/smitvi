import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { ValidationError } from "@/domain/shared/errors";
import {
  jsonCreated,
  jsonError,
  jsonOk,
} from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";

export async function GET() {
  try {
    const session = await requireSession();
    getRateLimiter().consume(`knowledge:list:${session.user.id}`);
    const sources = await container.knowledge.listByUser(session.user.id);
    return jsonOk({ sources });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    getRateLimiter().consume(`knowledge:upload:${session.user.id}`);

    const form = await request.formData();
    const file = form.get("file");
    const titleValue = form.get("title");
    const organizationIdValue = form.get("organizationId");
    const organizationId =
      typeof organizationIdValue === "string" && organizationIdValue.length > 0
        ? organizationIdValue
        : null;

    if (!(file instanceof File)) {
      throw new ValidationError("file is required");
    }

    if (organizationId) {
      await container.organizations.requireMembership(
        organizationId,
        session.user.id,
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const source = await container.uploadKnowledge.execute({
      userId: session.user.id,
      fileName: file.name,
      mimeType: file.type || null,
      bytes,
      title: typeof titleValue === "string" ? titleValue : undefined,
      organizationId,
    });

    return jsonCreated({ source });
  } catch (error) {
    return jsonError(error);
  }
}
