"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { UserRole } from "@/domain/user/entities";

type UserAdminActionsProps = {
  userId: string;
  email: string;
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
  email,
  role,
  isBanned,
  canMutate,
}: UserAdminActionsProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState(role);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!canMutate) {
    return <span className="text-xs text-[var(--muted)]">View only</span>;
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

  async function handleDelete() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/admin/users/${userId}`, {
        method: "DELETE",
      });
      const json = (await res.json()) as {
        error?: { message?: string };
      };
      if (!res.ok) {
        throw new Error(json.error?.message ?? "Delete failed");
      }
      toast.success("User deleted");
      setDeleteOpen(false);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Delete failed";
      setError(message);
      toast.error(message);
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
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </Button>
      </div>
      {error ? <p className="text-xs text-red-500">{error}</p> : null}

      <Dialog
        open={deleteOpen}
        onOpenChange={(next) => !pending && setDeleteOpen(next)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete user?</DialogTitle>
            <DialogDescription>
              Permanently delete {email}? This removes their profile, knowledge,
              chats, and auth account. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={() => setDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={() => void handleDelete()}
            >
              <Trash2 className="h-3.5 w-3.5" />
              {pending ? "Deleting…" : "Delete user"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
