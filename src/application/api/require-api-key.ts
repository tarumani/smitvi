import { getEntitlements } from "@/domain/billing/entitlements";
import { ForbiddenError, UnauthorizedError } from "@/domain/shared/errors";
import type { UserPlan } from "@/domain/user/entities";
import { container } from "@/application/container";

export async function requireApiKey(
  request: Request,
  requiredScope: string,
) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    throw new UnauthorizedError("Missing Bearer API key");
  }

  const rawKey = header.slice("Bearer ".length).trim();
  const auth = await container.apiKeys.authenticate(rawKey);
  container.apiKeys.requireScope(auth.scopes, requiredScope);

  const plan = auth.user.plan as UserPlan;
  const entitlements = getEntitlements(plan);
  if (!entitlements.publicApi) {
    throw new ForbiddenError(
      "Public API requires a Pro or Business plan",
    );
  }

  return {
    userId: auth.user.id,
    email: auth.user.email,
    plan,
    apiKeyId: auth.apiKeyId,
    scopes: auth.scopes,
  };
}
