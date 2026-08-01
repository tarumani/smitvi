"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type ReviewFormProps = {
  username: string;
  isAuthenticated: boolean;
};

export function ReviewForm({ username, isAuthenticated }: ReviewFormProps) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent(`/@${username}`)}`);
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch(`/api/v1/profiles/${username}/reviews`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rating, comment }),
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
              : "Review failed";
          throw new Error(message);
        }
        toast.success("Review saved");
        setComment("");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Review failed");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium" htmlFor="rating">
          Rating
        </label>
        <select
          id="rating"
          className="h-10 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
          value={rating}
          onChange={(event) => setRating(Number(event.target.value))}
        >
          {[5, 4, 3, 2, 1].map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>
      <Textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        placeholder="What was valuable about this expert’s knowledge?"
        className="min-h-[96px]"
      />
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving…" : "Submit review"}
      </Button>
    </form>
  );
}
