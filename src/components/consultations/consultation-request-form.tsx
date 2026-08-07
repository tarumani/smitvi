"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TextareaWithAi } from "@/components/ai/textarea-with-ai";

type ConsultationRequestFormProps = {
  username: string;
  defaultName?: string;
  defaultEmail?: string;
  durationMinutes: number;
  priceLabel: string;
};

export function ConsultationRequestForm({
  username,
  defaultName = "",
  defaultEmail = "",
  durationMinutes,
  priceLabel,
}: ConsultationRequestFormProps) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [message, setMessage] = useState("");
  const [preferredAt, setPreferredAt] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      try {
        const response = await fetch("/api/v1/consultations/requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username,
            requesterName: name,
            requesterEmail: email,
            message,
            preferredAt: preferredAt || null,
          }),
        });
        const json = (await response.json()) as { error?: { message?: string } };
        if (!response.ok) {
          throw new Error(json.error?.message ?? "Request failed");
        }
        setSent(true);
        toast.success("Consultation request sent");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Request failed");
      }
    });
  }

  if (sent) {
    return (
      <p className="text-sm text-[var(--muted-foreground)]">
        Request sent. The expert will follow up at {email}.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-xs text-[var(--muted)]">
        {durationMinutes} min · {priceLabel}
      </p>
      <div className="space-y-1.5">
        <Label htmlFor="c-name">Your name</Label>
        <Input
          id="c-name"
          required
          value={name}
          disabled={isPending}
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="c-email">Email</Label>
        <Input
          id="c-email"
          type="email"
          required
          value={email}
          disabled={isPending}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="c-preferred">Preferred time (optional)</Label>
        <Input
          id="c-preferred"
          type="datetime-local"
          value={preferredAt}
          disabled={isPending}
          onChange={(event) => setPreferredAt(event.target.value)}
        />
      </div>
      <TextareaWithAi
        id="c-message"
        label="What do you need help with?"
        purpose="generic"
        value={message}
        onChange={setMessage}
        placeholder="Share context for the session…"
        disabled={isPending}
        rows={4}
      />
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Sending…" : "Request consultation"}
      </Button>
    </form>
  );
}
