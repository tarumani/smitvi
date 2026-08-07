import { requireSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { ValidationError } from "@/domain/shared/errors";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { getRateLimiter } from "@/infrastructure/http/rate-limit";
import {
  publicAvatarPath,
  saveAvatarForUser,
  validateAvatarFile,
} from "@/infrastructure/storage/avatar-storage";

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    getRateLimiter().consume(`profile:avatar:${session.user.id}`);

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      throw new ValidationError("file is required");
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    validateAvatarFile(file, bytes);

    const mime = file.type?.toLowerCase() || "image/jpeg";
    await saveAvatarForUser(session.user.id, bytes, mime);

    const avatarUrl = publicAvatarPath(session.user.id);
    await container.updateProfile.execute(session.user.id, { avatarUrl });

    return jsonOk({ avatarUrl });
  } catch (error) {
    return jsonError(error);
  }
}
