import type { User as AuthUser } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { DomainError, UnauthorizedError } from "@/domain/shared/errors";
import type { UserEntity } from "@/domain/user/entities";
import type { ProfileSummary } from "@/domain/profile/entities";
import { container } from "@/application/container";
import { resolveEffectiveUserPlan } from "@/domain/billing/effective-plan";
import { resolveAuthUser } from "@/application/auth/resolve-auth-user";
import { LAST_LOGIN_TOUCH_INTERVAL_MS } from "@/config/inactive-users";
import { createSupabaseServerClient } from "@/infrastructure/auth/supabase/server";

export type CurrentSession = {
  readonly authUserId: string;
  readonly email: string;
  readonly user: UserEntity;
  readonly profile: ProfileSummary | null;
};

/** Email/password must confirm; OAuth providers are trusted. */
function isAuthEmailVerified(authUser: AuthUser): boolean {
  if (authUser.email_confirmed_at) return true;
  const provider = authUser.app_metadata?.provider;
  if (typeof provider === "string" && provider !== "email") return true;
  return (authUser.identities ?? []).some(
    (identity) => identity.provider !== "email",
  );
}

async function usesBearerAuth(): Promise<boolean> {
  const headerStore = await headers();
  return headerStore.get("authorization")?.startsWith("Bearer ") ?? false;
}

export async function getCurrentSession(): Promise<CurrentSession | null> {
  const authUser = await resolveAuthUser();
  const bearer = await usesBearerAuth();

  if (!authUser?.email) {
    return null;
  }

  // Email/password signups must verify before using the app.
  // Google OAuth accounts are confirmed by the provider.
  if (!isAuthEmailVerified(authUser)) {
    if (!bearer) {
      const supabase = await createSupabaseServerClient();
      await supabase.auth.signOut();
    }
    return null;
  }

  let user: UserEntity | null = await container.users.findById(authUser.id);

  try {
    if (!user) {
      user = await container.syncAuthenticatedUser.execute({
        id: authUser.id,
        email: authUser.email,
        emailVerified: true,
      });
    } else if (!user.emailVerified) {
      user = await container.users.syncFromAuth({
        id: authUser.id,
        email: authUser.email,
        emailVerified: true,
      });
    }
  } catch (error) {
    if (error instanceof DomainError && error.code === "FORBIDDEN") {
      if (!bearer) {
        const supabase = await createSupabaseServerClient();
        await supabase.auth.signOut();
      }
      return null;
    }
    throw error;
  }

  if (!user) {
    return null;
  }

  // Inactivity-paused abandoned accounts can recover by signing in again.
  if (user.inactiveBlockedAt && !user.isBanned) {
    user = await container.users.clearInactiveBlock(user.id);
  }

  if (!user.isActive || user.isBanned) {
    return null;
  }

  const lastTouch = user.lastLoginAt?.getTime() ?? 0;
  if (Date.now() - lastTouch >= LAST_LOGIN_TOUCH_INTERVAL_MS) {
    await container.users.updateLastLogin(user.id, new Date());
    user = { ...user, lastLoginAt: new Date() };
  }

  const profile = await container.profiles.findSummaryByUserId(user.id);

  const effectivePlan = resolveEffectiveUserPlan(user.plan, authUser.email);
  const userWithPlan =
    effectivePlan === user.plan ? user : { ...user, plan: effectivePlan };

  return {
    authUserId: authUser.id,
    email: authUser.email,
    user: userWithPlan,
    profile,
  };
}

export async function requireSession(): Promise<CurrentSession> {
  const session = await getCurrentSession();
  if (!session) {
    throw new UnauthorizedError();
  }
  return session;
}
