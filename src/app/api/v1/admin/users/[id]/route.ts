import { requirePrivilegedAdmin, assertAssignableRole } from "@/application/auth/require-admin";
import { container } from "@/application/container";
import { ForbiddenError, NotFoundError, ValidationError } from "@/domain/shared/errors";
import type { UserRole } from "@/domain/user/entities";
import { getSupabaseAdmin } from "@/infrastructure/auth/supabase/admin";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";

const ROLES: UserRole[] = [
  "USER",
  "EXPERT",
  "MODERATOR",
  "ADMIN",
  "SUPER_ADMIN",
];

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requirePrivilegedAdmin();
    const { id } = await context.params;
    const body = (await request.json()) as {
      role?: string;
      isBanned?: boolean;
    };

    const target = await container.users.findById(id);
    if (!target) {
      throw new NotFoundError("User not found");
    }

    if (target.id === session.user.id && body.isBanned === true) {
      throw new ForbiddenError("You cannot ban yourself");
    }

    if (body.role !== undefined) {
      if (!ROLES.includes(body.role as UserRole)) {
        throw new ValidationError("Invalid role");
      }
      const nextRole = body.role as UserRole;
      assertAssignableRole(session.user.role, nextRole);
      if (target.id === session.user.id && nextRole === "USER") {
        throw new ForbiddenError("You cannot demote yourself");
      }
      await container.users.updateRole(id, nextRole);
    }

    if (typeof body.isBanned === "boolean") {
      if (target.role === "SUPER_ADMIN" && session.user.role !== "SUPER_ADMIN") {
        throw new ForbiddenError("Cannot ban a super admin");
      }
      await container.users.setBanned(id, body.isBanned);
    }

    const updated = await container.users.findById(id);
    return jsonOk({ user: updated });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requirePrivilegedAdmin();
    const { id } = await context.params;

    const target = await container.users.findById(id);
    if (!target) {
      throw new NotFoundError("User not found");
    }

    if (target.id === session.user.id) {
      throw new ForbiddenError("You cannot delete your own account from Admin");
    }

    if (target.role === "SUPER_ADMIN" && session.user.role !== "SUPER_ADMIN") {
      throw new ForbiddenError("Cannot delete a super admin");
    }

    const supabase = getSupabaseAdmin();
    const { error: authError } = await supabase.auth.admin.deleteUser(id);
    if (authError && !/not (found|exist)|user not found/i.test(authError.message)) {
      throw new ValidationError(
        `Could not delete auth user: ${authError.message}`,
      );
    }

    const deleted = await container.users.deleteById(id);
    if (!deleted) {
      throw new NotFoundError("User not found");
    }

    return jsonOk({ deleted: true, id });
  } catch (error) {
    return jsonError(error);
  }
}
