import type { ReactNode } from "react";
import Link from "next/link";
import { ROUTES } from "@/config/constants";
import { cn } from "@/lib/utils";

export function SampleContentBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "rounded-md bg-[var(--surface)] px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-[var(--muted)] uppercase",
        className,
      )}
    >
      Sample
    </span>
  );
}

type ExpertProfileLinkProps = {
  username: string;
  isLive: boolean;
  className?: string;
  children: ReactNode;
};

/** Links to a real public hub when live; otherwise static (no fake @profile). */
export function ExpertProfileLink({
  username,
  isLive,
  className,
  children,
}: ExpertProfileLinkProps) {
  if (isLive) {
    return (
      <Link href={ROUTES.publicProfile(username)} className={className}>
        {children}
      </Link>
    );
  }
  return <div className={className}>{children}</div>;
}

type TwinChatLinkProps = {
  username: string;
  isLive: boolean;
  className?: string;
  children: ReactNode;
};

/** Live Twin chat, or product info when content is illustrative. */
export function TwinChatLink({
  username,
  isLive,
  className,
  children,
}: TwinChatLinkProps) {
  if (isLive) {
    return (
      <Link href={ROUTES.publicTwinChat(username)} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <Link href={ROUTES.productTwinChat} className={className}>
      {children}
    </Link>
  );
}
