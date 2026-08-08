import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getPublicEnv } from "@/config/env";

let anon: SupabaseClient | null = null;

/** Stateless anon client for auth emails (signup, recover, resend) — no cookies. */
export function createSupabaseAnonAuthClient(): SupabaseClient {
  const { supabaseUrl, supabaseAnonKey } = getPublicEnv();
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }
  if (!anon) {
    anon = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return anon;
}
