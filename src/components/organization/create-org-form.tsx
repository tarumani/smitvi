"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROUTES } from "@/config/constants";
import { normalizeOrgSlug } from "@/domain/organization/slug";

export function CreateOrgForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      try {
        const response = await fetch("/api/v1/orgs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, slug, description: description || null }),
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
              : "Could not create organization";
          throw new Error(message);
        }
        const org = (
          json as { data: { organization: { slug: string } } }
        ).data.organization;
        toast.success("Workspace created");
        router.push(ROUTES.organization(org.slug));
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Could not create organization",
        );
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="org-name">Company name</Label>
        <Input
          id="org-name"
          value={name}
          onChange={(event) => {
            const next = event.target.value;
            setName(next);
            if (!slugTouched) setSlug(normalizeOrgSlug(next));
          }}
          placeholder="Acme Intelligence"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="org-slug">Workspace URL</Label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--muted)]">/orgs/</span>
          <Input
            id="org-slug"
            value={slug}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(normalizeOrgSlug(event.target.value));
            }}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="org-description">Description</Label>
        <Input
          id="org-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Shared company knowledge twin"
        />
      </div>
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Creating…" : "Create workspace"}
      </Button>
    </form>
  );
}
