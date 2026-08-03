import { UnauthorizedError } from "@/domain/shared/errors";
import type { UserEntity } from "@/domain/user/entities";
import type { ProfileSummary } from "@/domain/profile/entities";
import { container } from "@/application/container";
import { createSupabaseServerClient } from "@/infrastructure/auth/supabase/server";

export type CurrentSession = {
  readonly authUserId: string;
  readonly email: string;
  readonly user: UserEntity;
  readonly profile: ProfileSummary | null;
};

export async function getCurrentSession(): Promise<CurrentSession | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser?.email) {
    return null;
  }

  // Email/password signups must verify before using the app.
  // Google OAuth accounts are confirmed by the provider.
  if (!authUser.email_confirmed_at) {
    await supabase.auth.signOut();
    return null;
  }

  let user = await container.users.findById(authUser.id);

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

  if (!user.isActive || user.isBanned) {
    return null;
  }

  const profile = await container.profiles.findSummaryByUserId(user.id);

  return {
    authUserId: authUser.id,
    email: authUser.email,
    user,
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
