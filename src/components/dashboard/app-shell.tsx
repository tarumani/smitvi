"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  BookOpen,
  Building2,
  CalendarDays,
  CircleDollarSign,
  CreditCard,
  Inbox,
  KeyRound,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import { AccountMenu } from "@/components/landing/account-menu";
import { SmitviLogo } from "@/components/brand/smitvi-logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { ROUTES, TRAIN_TWIN_LABEL, TRAIN_TWIN_NAV_SHORT } from "@/config/constants";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: React.ReactNode;
  displayName: string;
  username?: string | null;
  avatarUrl?: string | null;
  email: string;
  showAdmin?: boolean;
};

const baseNavItems = [
  { href: ROUTES.hub.dashboard, label: "Dashboard", icon: LayoutDashboard },
  { href: ROUTES.hub.intelligence, label: TRAIN_TWIN_LABEL, icon: BookOpen },
  { href: ROUTES.marketplaceSell, label: "Sell your expertise", icon: CircleDollarSign },
  { href: ROUTES.hub.leads, label: "Leads", icon: Users },
  { href: ROUTES.twinChat, label: "Twin Chat", icon: MessageSquare },
  { href: ROUTES.inbox, label: "Twin Inbox", icon: Inbox },
  { href: ROUTES.organizations, label: "Workspaces", icon: Building2 },
  { href: ROUTES.consultationSettings, label: "Consultations", icon: CalendarDays },
  { href: ROUTES.apiKeysSettings, label: "API keys", icon: KeyRound },
  { href: ROUTES.billingSettings, label: "Billing", icon: CreditCard },
  { href: ROUTES.profileSettings, label: "Profile", icon: Settings },
] as const;

const mobileNavItems = [
  { href: ROUTES.hub.dashboard, label: "Home", icon: LayoutDashboard },
  { href: ROUTES.hub.intelligence, label: TRAIN_TWIN_NAV_SHORT, icon: BookOpen },
  { href: ROUTES.organizations, label: "Orgs", icon: Building2 },
  { href: ROUTES.profileSettings, label: "You", icon: Settings },
] as const;

export function AppShell({
  children,
  displayName,
  username,
  avatarUrl,
  email,
  showAdmin = false,
}: AppShellProps) {
  const pathname = usePathname();
  const navItems = showAdmin
    ? [
        ...baseNavItems,
        { href: ROUTES.admin, label: "Admin", icon: Shield },
      ]
    : [...baseNavItems];

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
    };
  }, []);

  return (
    <div className="flex h-svh overflow-hidden bg-[var(--background)]">
      {/* Fixed sidebar — independent from page scroll */}
      <aside className="hidden h-svh w-60 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface-elevated)] lg:flex">
        <div className="shrink-0 border-b border-[var(--border)] px-4 py-4">
          <SmitviLogo href={ROUTES.hub.dashboard} size="sm" />
        </div>

        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-4 [scrollbar-width:thin]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="shrink-0 border-t border-[var(--border)] p-4">
          <Link
            href={ROUTES.marketplaceSell}
            prefetch
            className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-[var(--foreground)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]/40"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-[var(--accent)]">
              <CircleDollarSign className="h-4 w-4" />
              Sell your expertise
            </span>
            <span className="mt-1 text-[11px] font-medium leading-snug text-[var(--muted-foreground)]">
              List consults, packs, and offers on the marketplace.
            </span>
          </Link>
        </div>
      </aside>

      {/* Main column: fixed header + scrollable body */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="z-20 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--background)]/90 px-4 backdrop-blur-xl sm:px-6">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{displayName}</p>
            <p className="truncate text-xs text-[var(--muted)]">
              {username ? `@${username}` : email}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <AccountMenu
              user={{
                displayName,
                email,
                username: username ?? null,
                avatarUrl: avatarUrl ?? null,
              }}
            />
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-6 pb-24 sm:px-6 lg:pb-8 [scrollbar-width:thin]">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>

      {/* Mobile bottom nav */}
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
