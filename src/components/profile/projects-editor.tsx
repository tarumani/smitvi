"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TextareaWithAi } from "@/components/ai/textarea-with-ai";
import type { PortfolioItemEntity } from "@/domain/profile/entities";

type ProjectDraft = {
  key: string;
  title: string;
  description: string;
  url: string;
  imageUrl: string;
};

type ProjectsEditorProps = {
  initialProjects: readonly PortfolioItemEntity[];
};

function toDrafts(items: readonly PortfolioItemEntity[]): ProjectDraft[] {
  return items.map((item, index) => ({
    key: item.id || `project-${index}`,
    title: item.title,
    description: item.description ?? "",
    url: item.url ?? "",
    imageUrl: item.imageUrl ?? "",
  }));
}

function emptyProject(): ProjectDraft {
  return {
    key: `new-${crypto.randomUUID()}`,
    title: "",
    description: "",
    url: "",
    imageUrl: "",
  };
}

export function ProjectsEditor({ initialProjects }: ProjectsEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [projects, setProjects] = useState<ProjectDraft[]>(() =>
    toDrafts(initialProjects),
  );

  function updateProject(
    key: string,
    field: keyof Omit<ProjectDraft, "key">,
    value: string,
  ) {
    setProjects((current) =>
      current.map((project) =>
        project.key === key ? { ...project, [field]: value } : project,
      ),
    );
  }

  function moveProject(index: number, direction: -1 | 1) {
    setProjects((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return next;
    });
  }

  function handleSave() {
    startTransition(async () => {
      try {
        const cleaned = projects
          .map((project) => ({
            title: project.title.trim(),
            description: project.description.trim() || null,
            url: project.url.trim() || null,
            imageUrl: project.imageUrl.trim() || null,
          }))
          .filter((project) => project.title.length > 0);

        const response = await fetch("/api/v1/profiles/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ portfolio: cleaned }),
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
              : "Failed to save projects";
          throw new Error(message);
        }

        toast.success(
          cleaned.length
            ? "Projects published to your profile"
            : "Projects cleared",
        );
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to save projects",
        );
      }
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-bold tracking-tight">
          Projects
        </h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Add case studies and portfolio work. These appear on your public
          profile under Projects.
        </p>
      </div>

      <div className="space-y-4">
        {projects.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
            No projects yet. Add your first case study or portfolio piece.
          </p>
        ) : null}
        {projects.map((project, index) => (
          <div
            key={project.key}
            className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/50 p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">Project {index + 1}</p>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  disabled={isPending || index === 0}
                  onClick={() => moveProject(index, -1)}
                  aria-label="Move up"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  disabled={isPending || index === projects.length - 1}
                  onClick={() => moveProject(index, 1)}
                  aria-label="Move down"
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  disabled={isPending}
                  onClick={() =>
                    setProjects((current) =>
                      current.filter((item) => item.key !== project.key),
                    )
                  }
                  aria-label="Remove project"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`title-${project.key}`}>Title</Label>
              <Input
                id={`title-${project.key}`}
                value={project.title}
                disabled={isPending}
                onChange={(event) =>
                  updateProject(project.key, "title", event.target.value)
                }
                placeholder="Mobile banking redesign"
              />
            </div>

            <TextareaWithAi
              id={`description-${project.key}`}
              label="Description"
              purpose="generic"
              hint={project.title}
              value={project.description}
              onChange={(value) =>
                updateProject(project.key, "description", value)
              }
              placeholder="What you built, your role, and the outcome…"
              disabled={isPending}
              rows={4}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`url-${project.key}`}>Project link</Label>
                <Input
                  id={`url-${project.key}`}
                  type="url"
                  value={project.url}
                  disabled={isPending}
                  onChange={(event) =>
                    updateProject(project.key, "url", event.target.value)
                  }
                  placeholder="https://"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`image-${project.key}`}>Image URL</Label>
                <Input
                  id={`image-${project.key}`}
                  type="url"
                  value={project.imageUrl}
                  disabled={isPending}
                  onChange={(event) =>
                    updateProject(project.key, "imageUrl", event.target.value)
                  }
                  placeholder="https://…/preview.png"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={isPending || projects.length >= 20}
          onClick={() => setProjects((current) => [...current, emptyProject()])}
        >
          <Plus className="h-4 w-4" />
          Add project
        </Button>
        <Button type="button" disabled={isPending} onClick={handleSave}>
          {isPending ? "Saving…" : "Save projects"}
        </Button>
      </div>
    </div>
  );
}
