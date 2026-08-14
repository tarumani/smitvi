import { requireSession } from "@/application/auth/get-current-session";
import { ProfileActivationService } from "@/application/onboarding/profile-activation-service";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";

export async function GET() {
  try {
    const session = await requireSession();
    const snapshot = await new ProfileActivationService().gather(session.user.id);
    return jsonOk({
      readiness: snapshot?.readiness ?? null,
      activation: snapshot?.activation ?? null,
      activationStatus: snapshot?.profile.activationStatus ?? "REGISTERED",
      bioQuality: snapshot?.bioQuality ?? "EMPTY",
    });
  } catch (error) {
    return jsonError(error);
  }
}
