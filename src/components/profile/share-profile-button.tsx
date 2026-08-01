"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/constants";

type ShareProfileButtonProps = {
  username: string;
  mode?: "PROFILE" | "TWIN_CHAT";
};

export function ShareProfileButton({
  username,
  mode = "PROFILE",
}: ShareProfileButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  function handleShare() {
    startTransition(async () => {
      try {
        const publicPath =
          mode === "TWIN_CHAT"
            ? ROUTES.publicTwinChat(username)
            : ROUTES.publicProfile(username);
        const directUrl = `${window.location.origin}${publicPath}`;

        // Prefer native share / clipboard with direct @username URL.
        if (navigator.share) {
          await navigator.share({
            title: `Smitvi @${username}`,
            url: directUrl,
          });
          return;
        }

        await navigator.clipboard.writeText(directUrl);
        setCopied(true);
        toast.success("Profile link copied");
        window.setTimeout(() => setCopied(false), 2000);

        // Also create a tracked share link for analytics when signed in.
        void fetch("/api/v1/share", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: mode }),
        });
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        toast.error("Could not share link");
      }
    });
  }

  return (
    <Button variant="outline" onClick={handleShare} disabled={isPending}>
      {copied ? "Copied" : "Share"}
    </Button>
  );
}
