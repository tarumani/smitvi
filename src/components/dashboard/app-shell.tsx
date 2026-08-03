"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  Building2,
  Compass,
  CreditCard,
  KeyRound,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Search,
  Settings,
  Store,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SmitviLogo } from "@/components/brand/smitvi-logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { ROUTES } from "@/config/constants";
import { createSupabaseBrowserClient } from "@/infrastructure/auth/supabase/client";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: React.ReactNode;
  displayName: string;
  username?: string | null;
  avatarUrl?: string | null;
  email: string;
};

const navItems = [
  { href: ROUTES.dashboard, label: "Dashboard", icon: LayoutDashboard },
  { href: ROUTES.knowledge, label: "Knowledge", icon: BookOpen },
  { href: ROUTES.twinChat, label: "Twin Chat", icon: MessageSquare },
  { href: ROUTES.organizations, label: "Workspaces", icon: Building2 },
  { href: ROUTES.marketplace, label: "Marketplace", icon: Store },
  { href: ROUTES.search, label: "Search", icon: Search },
  { href: ROUTES.discover, label: "Discover", icon: Compass },
  { href: ROUTES.apiKeysSettings, label: "API Keys", icon: KeyRound },
  { href: ROUTES.billingSettings, label: "Billing", icon: CreditCard },
  { href: ROUTES.profileSettings, label: "Profile", icon: Settings },
] as const;

const mobileNavItems = [
  { href: ROUTES.dashboard, label: "Home", icon: LayoutDashboard },
  { href: ROUTES.knowledge, label: "Knowledge", icon: BookOpen },
  { href: ROUTES.twinChat, label: "Chat", icon: MessageSquare },
  { href: ROUTES.organizations, label: "Orgs", icon: Building2 },
  { href: ROUTES.profileSettings, label: "You", icon: Settings },
] as const;

export function AppShell({
  children,
  displayName,
  username,
  avatarUrl,
  email,
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Signed out");
    router.replace(ROUTES.home);
    router.refresh();
  }

  return (
    <div className="min-h-full">
      <div className="mx-auto grid min-h-full w-full max-w-7xl lg:grid-cols-[240px_1fr]">
        <aside className="hidden border-r border-[var(--border)] bg-[var(--surface)]/35 px-4 py-6 backdrop-blur-xl lg:block">
          <SmitviLogo href={ROUTES.dashboard} size="sm" />
          <nav className="mt-8 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "text-[var(--muted-foreground)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
              Knowledge Twin
            </p>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              Upload sources, chat, speak, or call the Public API.
            </p>
          </div>
        </aside>

        <div className="flex min-h-full flex-col pb-20 lg:pb-0">
          <header className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <Avatar src={avatarUrl} name={displayName} />
              <div>
                <p className="text-sm font-semibold">{displayName}</p>
                <p className="text-xs text-[var(--muted)]">
                  {username ? `@${username}` : email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </div>
          </header>
          <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[var(--background)]/95 backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5 gap-1 px-2 py-2">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-medium",
                  active
                    ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "text-[var(--muted-foreground)]",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
