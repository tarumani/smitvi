import { z } from "zod";
import { buildPasswordResetRedirectTo } from "@/application/auth/password-reset-redirect";
import { resolveAuthEmailOrigin } from "@/application/auth/auth-email-redirect";
import { ValidationError } from "@/domain/shared/errors";
import { createSupabaseAnonAuthClient } from "@/infrastructure/auth/supabase/anon-auth";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { formatAuthErrorMessage } from "@/lib/auth-error-message";

const bodySchema = z.object({
  email: z.string().trim().email(),
});

export async function POST(request: Request) {
  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ValidationError("Enter a valid email address");
    }

    const redirectTo = buildPasswordResetRedirectTo(
      resolveAuthEmailOrigin(request),
    );
    const supabase = createSupabaseAnonAuthClient();
    const { error } = await supabase.auth.resetPasswordForEmail(
      parsed.data.email,
      { redirectTo },
    );

    if (error) {
      console.error("[auth/forgot-password]", {
        message: error.message,
        status: error.status,
        code: error.code,
        redirectTo,
      });
      throw new ValidationError(
        formatAuthErrorMessage(error, "Could not send reset email", "reset-email"),
      );
    }

    return jsonOk({ sent: true });
  } catch (e) {
    return jsonError(e);
  }
}
