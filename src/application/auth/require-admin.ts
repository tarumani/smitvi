import { ForbiddenError } from "@/domain/shared/errors";
import {
  canAccessAdmin,
  isPrivileged,
  type UserRole,
} from "@/domain/user/entities";
import { container } from "@/application/container";
import {
  getCurrentSession,
  requireSession,
  type CurrentSession,
} from "@/application/auth/get-current-session";

function platformAdminEmails(): string[] {
  return (process.env.PLATFORM_ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

async function maybeBootstrapAdmin(
  session: CurrentSession,
): Promise<CurrentSession> {
  if (canAccessAdmin(session.user.role)) {
    return session;
  }

  const emails = platformAdminEmails();
  if (!emails.includes(session.email.toLowerCase())) {
    return session;
  }

  const user = await container.users.updateRole(session.user.id, "ADMIN");
  return { ...session, user };
}

export async function getAdminSession(): Promise<CurrentSession | null> {
  const session = await getCurrentSession();
  if (!session) return null;
  const elevated = await maybeBootstrapAdmin(session);
  if (!canAccessAdmin(elevated.user.role)) return null;
  return elevated;
}

export async function requireAdmin(): Promise<CurrentSession> {
  const session = await requireSession();
  const elevated = await maybeBootstrapAdmin(session);
  if (!canAccessAdmin(elevated.user.role)) {
    throw new ForbiddenError("Admin access required");
  }
  return elevated;
}

/** Ban / role changes — ADMIN and SUPER_ADMIN only (not MODERATOR). */
export async function requirePrivilegedAdmin(): Promise<CurrentSession> {
  const session = await requireAdmin();
  if (!isPrivileged(session.user.role)) {
    throw new ForbiddenError("Privileged admin access required");
  }
  return session;
}

export function assertAssignableRole(
  actorRole: UserRole,
  nextRole: UserRole,
): void {
  if (nextRole === "SUPER_ADMIN" && actorRole !== "SUPER_ADMIN") {
    throw new ForbiddenError("Only a super admin can assign SUPER_ADMIN");
  }
}
