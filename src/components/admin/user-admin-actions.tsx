"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { UserRole } from "@/domain/user/entities";

type UserAdminActionsProps = {
  userId: string;
  role: UserRole;
  isBanned: boolean;
  canMutate: boolean;
};

const ROLE_OPTIONS: UserRole[] = [
  "USER",
  "EXPERT",
  "MODERATOR",
  "ADMIN",
  "SUPER_ADMIN",
];

export function UserAdminActions({
  userId,
  role,
  isBanned,
  canMutate,
}: UserAdminActionsProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState(role);

  if (!canMutate) {
    return (
      <span className="text-xs text-[var(--muted)]">View only</span>
    );
  }

  async function patch(body: { role?: UserRole; isBanned?: boolean }) {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as {
        error?: { message?: string };
      };
      if (!res.ok) {
        throw new Error(json.error?.message ?? "Update failed");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <select
          className="h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 text-xs"
          value={currentRole}
          disabled={pending}
          onChange={(event) => {
            const next = event.target.value as UserRole;
            setCurrentRole(next);
            void patch({ role: next });
          }}
        >
          {ROLE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          variant={isBanned ? "secondary" : "destructive"}
          disabled={pending}
          onClick={() => void patch({ isBanned: !isBanned })}
        >
          {isBanned ? "Unban" : "Ban"}
        </Button>
      </div>
      {error ? <p className="text-xs text-red-500">{error}</p> : null}
    </div>
  );
}
