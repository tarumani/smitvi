"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/config/constants";
import { cn } from "@/lib/utils";

const items = [
  { href: ROUTES.admin, label: "Overview" },
  { href: ROUTES.adminUsers, label: "Users" },
  { href: ROUTES.adminTwins, label: "Twins" },
  { href: ROUTES.adminKnowledge, label: "Uploads" },
  { href: ROUTES.adminGrowth, label: "Growth" },
  { href: ROUTES.adminModeration, label: "Flags" },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2">
      {items.map((item) => {
        const active =
          item.href === ROUTES.admin
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                : "text-[var(--muted-foreground)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
