import { requireSession } from "@/application/auth/get-current-session";
import { ProfileActivationService } from "@/application/onboarding/profile-activation-service";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";

export async function POST() {
  try {
    const session = await requireSession();
    const result = await new ProfileActivationService().refresh(session.user.id);
    return jsonOk({
      activation: result?.activation,
      readiness: result?.readiness,
      activationStatus: result?.activationStatus,
      missing: result?.activation.missing,
    });
  } catch (error) {
    return jsonError(error);
  }
}
