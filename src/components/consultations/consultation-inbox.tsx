"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";

type RequestItem = {
  id: string;
  requesterName: string;
  requesterEmail: string;
  message: string | null;
  preferredAt: string | null;
  status: string;
  createdAt: string;
};

type ConsultationInboxProps = {
  requests: RequestItem[];
};

export function ConsultationInbox({ requests }: ConsultationInboxProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function updateStatus(id: string, status: "ACCEPTED" | "DECLINED" | "COMPLETED") {
    setPendingId(id);
    try {
      const response = await fetch(`/api/v1/consultations/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = (await response.json()) as { error?: { message?: string } };
      if (!response.ok) {
        throw new Error(json.error?.message ?? "Update failed");
      }
      toast.success(`Marked ${status.toLowerCase()}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    } finally {
      setPendingId(null);
    }
  }

  if (requests.length === 0) {
    return (
      <GlassCard className="p-5 text-sm text-[var(--muted-foreground)]">
        No consultation requests yet. Enable your offer and share your public
        profile.
      </GlassCard>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((item) => (
        <GlassCard key={item.id} className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="font-semibold">{item.requesterName}</p>
              <p className="text-sm text-[var(--muted-foreground)]">
                {item.requesterEmail}
              </p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {item.status} · {new Date(item.createdAt).toLocaleString()}
                {item.preferredAt
                  ? ` · preferred ${new Date(item.preferredAt).toLocaleString()}`
                  : ""}
              </p>
              {item.message ? (
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                  {item.message}
                </p>
              ) : null}
            </div>
            {item.status === "PENDING" ? (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={pendingId === item.id}
                  onClick={() => void updateStatus(item.id, "ACCEPTED")}
                >
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={pendingId === item.id}
                  onClick={() => void updateStatus(item.id, "DECLINED")}
                >
                  Decline
                </Button>
              </div>
            ) : item.status === "ACCEPTED" ? (
              <Button
                size="sm"
                variant="secondary"
                disabled={pendingId === item.id}
                onClick={() => void updateStatus(item.id, "COMPLETED")}
              >
                Mark completed
              </Button>
            ) : null}
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
