import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { APP_NAME, ROUTES } from "@/config/constants";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)]/80 bg-[var(--background)]/55 backdrop-blur-2xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href={ROUTES.home}
          className="font-display text-xl font-extrabold tracking-tight transition-opacity hover:opacity-80"
        >
          {APP_NAME}
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-[var(--muted-foreground)] md:flex">
          <Link
            href={ROUTES.discover}
            className="transition-colors hover:text-[var(--foreground)]"
          >
            Discover
          </Link>
          <Link
            href={ROUTES.marketplace}
            className="transition-colors hover:text-[var(--foreground)]"
          >
            Marketplace
          </Link>
          <Link
            href={ROUTES.pricing}
            className="transition-colors hover:text-[var(--foreground)]"
          >
            Pricing
          </Link>
          <Link
            href={ROUTES.developers}
            className="transition-colors hover:text-[var(--foreground)]"
          >
            Developers
          </Link>
          <a
            href="#demo"
            className="transition-colors hover:text-[var(--foreground)]"
          >
            Demo
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hidden sm:inline-flex"
          >
            <Link href={ROUTES.login}>Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href={ROUTES.signup}>Create Twin</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
