import { z } from "zod";
import { buildAuthCallbackRedirectTo } from "@/application/auth/auth-email-redirect";
import { ValidationError } from "@/domain/shared/errors";
import { createSupabaseServerClient } from "@/infrastructure/auth/supabase/server";
import { getRequestOrigin } from "@/infrastructure/http/request-origin";
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

    const redirectTo = buildAuthCallbackRedirectTo(getRequestOrigin(request));
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: parsed.data.email,
      options: { emailRedirectTo: redirectTo },
    });

    if (error) {
      console.error("[auth/resend-verification]", {
        message: error.message,
        status: error.status,
        code: error.code,
        redirectTo,
      });
      throw new ValidationError(
        formatAuthErrorMessage(error, "Could not resend verification email"),
      );
    }

    return jsonOk({ sent: true });
  } catch (e) {
    return jsonError(e);
  }
}
