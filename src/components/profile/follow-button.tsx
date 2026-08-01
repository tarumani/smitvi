"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type FollowButtonProps = {
  username: string;
  initialFollowing: boolean;
  isAuthenticated: boolean;
};

export function FollowButton({
  username,
  initialFollowing,
  isAuthenticated,
}: FollowButtonProps) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent(`/@${username}`)}`);
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch(`/api/v1/profiles/${username}/follow`, {
          method: following ? "DELETE" : "POST",
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
              : "Follow failed";
          throw new Error(message);
        }
        setFollowing(!following);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Follow failed");
      }
    });
  }

  return (
    <Button
      variant={following ? "secondary" : "default"}
      onClick={handleClick}
      disabled={isPending}
    >
      {following ? "Following" : "Follow"}
    </Button>
  );
}
