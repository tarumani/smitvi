import Link from "next/link";
import type { AdminUserListFilter } from "@/domain/user/ports";
import { ROUTES } from "@/config/constants";
import { cn } from "@/lib/utils";

const FILTERS: {
  value: AdminUserListFilter;
  label: string;
}[] = [
  { value: "all", label: "All" },
  { value: "incomplete", label: "Incomplete" },
  { value: "stale", label: "7+ days incomplete" },
  { value: "paused", label: "Auto-paused" },
  { value: "dormant", label: "Dormant" },
];

type AdminUserListFiltersProps = {
  active: AdminUserListFilter;
  q?: string;
  counts: Record<AdminUserListFilter, number>;
};

function filterHref(filter: AdminUserListFilter, q?: string): string {
  const params = new URLSearchParams();
  if (filter !== "all") params.set("filter", filter);
  if (q?.trim()) params.set("q", q.trim());
  const query = params.toString();
  return query ? `${ROUTES.adminUsers}?${query}` : ROUTES.adminUsers;
}

export function AdminUserListFilters({
  active,
  q,
  counts,
}: AdminUserListFiltersProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      {FILTERS.map((item) => {
        const selected = active === item.value;
        return (
          <Link
            key={item.value}
            href={filterHref(item.value, q)}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              selected
                ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                : "text-[var(--muted-foreground)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]",
            )}
          >
            {item.label}
            <span
              className={cn(
                "rounded-md px-1.5 py-0.5 text-xs tabular-nums",
                selected
                  ? "bg-[var(--surface)] text-[var(--foreground)]"
                  : "bg-[var(--surface-elevated)] text-[var(--muted)]",
              )}
            >
              {counts[item.value]}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

export function parseAdminUserListFilter(
  value: string | undefined,
): AdminUserListFilter {
  if (
    value === "incomplete" ||
    value === "dormant" ||
    value === "paused" ||
    value === "stale"
  ) {
    return value;
  }
  return "all";
}
