import { ValidationError } from "@/domain/shared/errors";
import { container } from "@/application/container";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      portfolioUrl?: string;
      profession?: string;
      skills?: string[];
    };
    if (!body.portfolioUrl?.startsWith("http")) {
      throw new ValidationError("A public portfolio URL (https://) is required");
    }
    const audit = container.portfolioAudit.auditFromUrl(body.portfolioUrl, {
      profession: body.profession,
      skills: body.skills,
    });
    return jsonOk({ audit });
  } catch (e) {
    return jsonError(e);
  }
}
