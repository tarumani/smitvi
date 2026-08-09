import { createClient, type User as AuthUser } from "@supabase/supabase-js";
import { getPublicEnv } from "@/config/env";

/** Validate a Supabase access token from mobile `Authorization: Bearer` headers. */
export async function getAuthUserFromAccessToken(
  accessToken: string,
): Promise<AuthUser | null> {
  const token = accessToken.trim();
  if (!token) return null;

  const { supabaseUrl, supabaseAnonKey } = getPublicEnv();
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  return user;
}
