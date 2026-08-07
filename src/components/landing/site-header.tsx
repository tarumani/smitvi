import Link from "next/link";
import { headers } from "next/headers";
import { getCurrentSession } from "@/application/auth/get-current-session";
import { Button } from "@/components/ui/button";
import { SmitviLogo } from "@/components/brand/smitvi-logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { AccountMenu } from "@/components/landing/account-menu";
import { SiteNav } from "@/components/landing/site-nav";
import { ROUTES } from "@/config/constants";

export async function SiteHeader() {
  const session = await getCurrentSession();
  const headerStore = await headers();
  const pathname = headerStore.get("x-pathname") ?? "";
  const isPublicHubProfile =
    pathname.startsWith("/@") ||
    pathname.startsWith("/u/") ||
    /^\/@[^/]+$/.test(pathname);
  const accountUser = session
    ? {
        displayName:
          session.profile?.displayName ??
          session.email.split("@")[0] ??
          "Account",
        email: session.email,
        username: session.profile?.username ?? null,
        avatarUrl: session.profile?.avatarUrl ?? null,
      }
    : null;

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)]/70 bg-[var(--background)]/70 backdrop-blur-2xl">
      <div className="relative mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
        <SmitviLogo className="shrink-0" size="md" />

        <div className="hidden flex-1 justify-center md:flex">
          {!isPublicHubProfile ? <SiteNav variant="desktop" /> : null}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          {accountUser ? (
            <AccountMenu user={accountUser} />
          ) : (
            <>
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
            </>
          )}
          <div className="md:hidden">
            <SiteNav variant="mobile" signedIn={Boolean(accountUser)} />
          </div>
        </div>
      </div>
    </header>
  );
}
