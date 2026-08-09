import type { User as AuthUser } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { getAuthUserFromAccessToken } from "@/infrastructure/auth/supabase/bearer-auth";
import { createSupabaseServerClient } from "@/infrastructure/auth/supabase/server";

const BEARER_PREFIX = "Bearer ";

export async function resolveAuthUser(): Promise<AuthUser | null> {
  const headerStore = await headers();
  const authorization = headerStore.get("authorization");

  if (authorization?.startsWith(BEARER_PREFIX)) {
    const token = authorization.slice(BEARER_PREFIX.length).trim();
    if (token) {
      return getAuthUserFromAccessToken(token);
    }
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}
