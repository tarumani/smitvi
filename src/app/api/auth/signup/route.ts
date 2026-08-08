import { z } from "zod";
import { buildAuthCallbackRedirectTo } from "@/application/auth/auth-email-redirect";
import { ValidationError } from "@/domain/shared/errors";
import { createSupabaseServerClient } from "@/infrastructure/auth/supabase/server";
import { getRequestOrigin } from "@/infrastructure/http/request-origin";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";
import { formatAuthErrorMessage } from "@/lib/auth-error-message";

const bodySchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ValidationError("Enter a valid email and password (8+ characters).");
    }

    const redirectTo = buildAuthCallbackRedirectTo(getRequestOrigin(request));
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: { emailRedirectTo: redirectTo },
    });

    if (error) {
      console.error("[auth/signup]", {
        message: error.message,
        status: error.status,
        code: error.code,
        redirectTo,
      });
      throw new ValidationError(
        formatAuthErrorMessage(error, "Could not create account"),
      );
    }

    return jsonOk({
      user: data.user
        ? {
            id: data.user.id,
            email: data.user.email,
            identitiesCount: data.user.identities?.length ?? 0,
            emailConfirmed: Boolean(data.user.email_confirmed_at),
          }
        : null,
      session: Boolean(data.session),
    });
  } catch (e) {
    return jsonError(e);
  }
}
