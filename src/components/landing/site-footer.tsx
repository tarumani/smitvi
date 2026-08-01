import Link from "next/link";
import { APP_NAME, APP_TAGLINE, ROUTES } from "@/config/constants";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--border)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-12 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div>
          <p className="font-display text-2xl font-extrabold tracking-tight">
            {APP_NAME}
          </p>
          <p className="mt-2 max-w-sm text-sm text-[var(--muted-foreground)]">
            {APP_TAGLINE}
          </p>
        </div>
        <div className="flex gap-6 text-sm font-medium text-[var(--muted-foreground)]">
          <Link
            href={ROUTES.login}
            className="transition-colors hover:text-[var(--foreground)]"
          >
            Sign in
          </Link>
          <Link
            href={ROUTES.signup}
            className="transition-colors hover:text-[var(--foreground)]"
          >
            Create Twin
          </Link>
        </div>
      </div>
    </footer>
  );
}
