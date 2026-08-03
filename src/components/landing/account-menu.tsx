"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import {
  Inbox,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Settings,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { ROUTES } from "@/config/constants";
import { createSupabaseBrowserClient } from "@/infrastructure/auth/supabase/client";
import { cn } from "@/lib/utils";

export type AccountMenuUser = {
  displayName: string;
  email: string;
  username: string | null;
  avatarUrl: string | null;
};

type AccountMenuProps = {
  user: AccountMenuUser;
};

export function AccountMenu({ user }: AccountMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function handleSignOut() {
    setOpen(false);
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
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] p-0.5 pr-2 transition-colors hover:bg-[var(--surface-elevated)]"
      >
        <Avatar
          src={user.avatarUrl}
          name={user.displayName}
          className="h-8 w-8"
        />
        <span className="hidden max-w-[7rem] truncate text-xs font-semibold sm:inline">
          {user.displayName}
        </span>
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] shadow-[var(--glass-shadow)]"
        >
          <div className="border-b border-[var(--border)] px-4 py-3">
            <p className="truncate text-sm font-semibold">{user.displayName}</p>
            <p className="truncate text-xs text-[var(--muted)]">{user.email}</p>
          </div>

          <div className="p-1.5">
            <MenuLink
              href={ROUTES.dashboard}
              icon={LayoutDashboard}
              onClick={() => setOpen(false)}
            >
              Dashboard
            </MenuLink>
            <MenuLink
              href={ROUTES.inbox}
              icon={Inbox}
              onClick={() => setOpen(false)}
            >
              Twin Inbox
            </MenuLink>
            {user.username ? (
              <MenuLink
                href={ROUTES.publicProfile(user.username)}
                icon={UserRound}
                onClick={() => setOpen(false)}
              >
                My public profile
              </MenuLink>
            ) : null}
            <MenuLink
              href={ROUTES.profileSettings}
              icon={Settings}
              onClick={() => setOpen(false)}
            >
              Edit profile
            </MenuLink>
            <MenuLink
              href={ROUTES.passwordSettings}
              icon={KeyRound}
              onClick={() => setOpen(false)}
            >
              Change password
            </MenuLink>
            <button
              type="button"
              role="menuitem"
              onClick={() => void handleSignOut()}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[var(--muted-foreground)] transition-colors",
                "hover:bg-[var(--surface)] hover:text-[var(--foreground)]",
              )}
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MenuLink({
  href,
  icon: Icon,
  onClick,
  children,
}: {
  href: string;
  icon: typeof LayoutDashboard;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
    >
      <Icon className="h-4 w-4" />
      {children}
    </Link>
  );
}
