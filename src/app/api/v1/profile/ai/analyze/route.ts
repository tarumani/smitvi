import { requireSession } from "@/application/auth/get-current-session";
import { AnalyzeProfileNarrative } from "@/application/onboarding/analyze-profile-narrative";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";
import type { ProfileTypeId } from "@/domain/profile/activation";

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    getRateLimiter().consume(`profile:ai:analyze:${session.user.id}`);
    const body = (await request.json()) as {
      narrative?: string;
      profileType?: ProfileTypeId;
      linkedInUrl?: string | null;
      websiteUrl?: string | null;
      portfolioUrl?: string | null;
      keepExisting?: boolean;
    };
    const result = await new AnalyzeProfileNarrative().execute({
      userId: session.user.id,
      email: session.email,
      narrative: body.narrative ?? "",
      profileType: body.profileType ?? "PROFESSIONAL",
      linkedInUrl: body.linkedInUrl,
      websiteUrl: body.websiteUrl,
      portfolioUrl: body.portfolioUrl,
      keepExisting: body.keepExisting,
    });
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
