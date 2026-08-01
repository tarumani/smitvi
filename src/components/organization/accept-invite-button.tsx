"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/constants";

type AcceptInviteButtonProps = {
  token: string;
};

export function AcceptInviteButton({ token }: AcceptInviteButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function accept() {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/v1/orgs/invites/${token}/accept`, {
          method: "POST",
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
              : "Could not accept invite";
          throw new Error(message);
        }
        const org = (
          json as { data: { organization: { slug: string } } }
        ).data.organization;
        toast.success("Joined workspace");
        router.push(ROUTES.organization(org.slug));
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Could not accept invite",
        );
      }
    });
  }

  return (
    <Button onClick={accept} disabled={isPending}>
      {isPending ? "Joining…" : "Accept invite"}
    </Button>
  );
}
