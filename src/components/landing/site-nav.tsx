"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/constants";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: ROUTES.discover, label: "Discover" },
  { href: ROUTES.marketplace, label: "Marketplace" },
  { href: ROUTES.search, label: "Search" },
  { href: ROUTES.pricing, label: "Pricing" },
  { href: ROUTES.developers, label: "Developers" },
] as const;

function linkActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

type SiteNavProps = {
  variant: "desktop" | "mobile";
};

export function SiteNav({ variant }: SiteNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (variant === "desktop") {
    return (
      <nav className="flex items-center gap-7 text-sm font-medium text-[var(--muted-foreground)]">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "relative transition-colors hover:text-[var(--foreground)]",
              linkActive(pathname, link.href) && "text-[var(--foreground)]",
            )}
          >
            {link.label}
            {linkActive(pathname, link.href) ? (
              <span className="absolute -bottom-2 left-0 h-0.5 w-full rounded-full bg-[var(--accent)]" />
            ) : null}
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {open ? (
        <div className="absolute inset-x-0 top-full border-b border-[var(--border)] bg-[var(--background)]/95 px-4 py-4 shadow-lg backdrop-blur-xl">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  linkActive(pathname, link.href)
                    ? "bg-[var(--accent-soft)] text-[var(--foreground)]"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]",
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-[var(--border)] pt-3 sm:hidden">
              <Button asChild variant="secondary" size="sm">
                <Link href={ROUTES.login} onClick={() => setOpen(false)}>
                  Sign in
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link href={ROUTES.signup} onClick={() => setOpen(false)}>
                  Create Twin
                </Link>
              </Button>
            </div>
          </nav>
        </div>
      ) : null}
    </>
  );
}
