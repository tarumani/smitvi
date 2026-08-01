"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type InviteMemberFormProps = {
  slug: string;
};

export function InviteMemberForm({ slug }: InviteMemberFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"MEMBER" | "ADMIN">("MEMBER");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      try {
        const response = await fetch(`/api/v1/orgs/${slug}/invites`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, role }),
        });
        const json: unknown = await response.json();
        if (!response.ok) {
          const message =
            typeof json === "object" &&
            json !== null &&
            "error" in json &&
            typeof (json as { error?: { message?: string } }).error?.message ===
              "string"
              ? (json as { error: { message: string } }).error.message
              : "Invite failed";
          throw new Error(message);
        }
        const inviteUrl = (
          json as { data: { inviteUrl: string } }
        ).data.inviteUrl;
        await navigator.clipboard.writeText(inviteUrl);
        toast.success("Invite created — link copied to clipboard");
        setEmail("");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Invite failed");
      }
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
      <div className="space-y-2 sm:col-span-1">
        <Label htmlFor="invite-email">Email</Label>
        <Input
          id="invite-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="teammate@company.com"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="invite-role">Role</Label>
        <select
          id="invite-role"
          value={role}
          onChange={(event) =>
            setRole(event.target.value as "MEMBER" | "ADMIN")
          }
          className="flex h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
        >
          <option value="MEMBER">Member</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>
      <div className="flex items-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Inviting…" : "Invite"}
        </Button>
      </div>
    </form>
  );
}
