"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/ui/glass-card";

type ApiKeyRow = {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  lastUsedAt: string | Date | null;
  revokedAt: string | Date | null;
  createdAt: string | Date;
};

type ApiKeysPanelProps = {
  keys: ApiKeyRow[];
  canCreate: boolean;
};

export function ApiKeysPanel({ keys, canCreate }: ApiKeysPanelProps) {
  const router = useRouter();
  const [name, setName] = useState("Production");
  const [rawKey, setRawKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function createKey() {
    startTransition(async () => {
      try {
        const response = await fetch("/api/v1/api-keys", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
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
              : "Could not create key";
          throw new Error(message);
        }
        const created = (
          json as { data: { rawKey: string } }
        ).data.rawKey;
        setRawKey(created);
        await navigator.clipboard.writeText(created);
        toast.success("API key created — copied to clipboard");
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Could not create key",
        );
      }
    });
  }

  function revoke(id: string) {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/v1/api-keys/${id}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          throw new Error("Could not revoke key");
        }
        toast.success("API key revoked");
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Could not revoke key",
        );
      }
    });
  }

  return (
    <div className="space-y-6">
      {canCreate ? (
        <GlassCard className="space-y-4 p-6">
          <div className="space-y-2">
            <Label htmlFor="key-name">Key name</Label>
            <Input
              id="key-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <Button onClick={createKey} disabled={isPending}>
            {isPending ? "Creating…" : "Create API key"}
          </Button>
          {rawKey ? (
            <p className="break-all rounded-xl bg-[var(--background)] p-3 font-mono text-xs ring-1 ring-[var(--border)]">
              {rawKey}
            </p>
          ) : null}
        </GlassCard>
      ) : (
        <GlassCard className="p-5 text-sm text-[var(--muted-foreground)]">
          Upgrade to Pro or Business to create API keys.
        </GlassCard>
      )}

      <section className="space-y-3">
        {keys.map((key) => (
          <GlassCard key={key.id} className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">{key.name}</p>
                <p className="font-mono text-xs text-[var(--muted)]">
                  {key.keyPrefix}… · {key.scopes.join(", ")}
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {key.revokedAt
                    ? "Revoked"
                    : `Created ${new Date(key.createdAt).toLocaleDateString()}`}
                </p>
              </div>
              {!key.revokedAt ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => revoke(key.id)}
                >
                  Revoke
                </Button>
              ) : null}
            </div>
          </GlassCard>
        ))}
      </section>
    </div>
  );
}
