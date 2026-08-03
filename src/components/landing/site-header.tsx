import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { SiteNav } from "@/components/landing/site-nav";
import { APP_NAME, ROUTES } from "@/config/constants";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)]/70 bg-[var(--background)]/70 backdrop-blur-2xl">
      <div className="relative mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link
          href={ROUTES.home}
          className="font-display shrink-0 text-xl font-extrabold tracking-tight transition-opacity hover:opacity-80"
        >
          {APP_NAME}
        </Link>

        <div className="hidden flex-1 justify-center md:flex">
          <SiteNav variant="desktop" />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hidden sm:inline-flex"
          >
            <Link href={ROUTES.login}>Sign in</Link>
          </Button>
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href={ROUTES.signup}>Create Twin</Link>
          </Button>
          <div className="md:hidden">
            <SiteNav variant="mobile" />
          </div>
        </div>
      </div>
    </header>
  );
}
