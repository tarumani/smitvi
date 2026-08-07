import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/constants";
import { cn } from "@/lib/utils";

export type TopEarnerRow = {
  username: string;
  displayName: string;
  headline: string | null;
  earningsLabel: string;
};

type Props = {
  earners: TopEarnerRow[];
  /** When false, rows are illustrative only — not links to sample hub profiles. */
  hasLiveEarners: boolean;
  sellHref: string;
  className?: string;
};

export function TopEarnersPanel({
  earners,
  hasLiveEarners,
  sellHref,
  className,
}: Props) {
  return (
    <aside className={cn("space-y-4", className)}>
      <div>
        <h2 className="font-display text-lg font-semibold tracking-tight">
          Top earners on the marketplace
        </h2>
        {hasLiveEarners ? (
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            Net marketplace earnings from paid orders.
          </p>
        ) : (
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            Sample leaderboard for layout only — not real sellers or payouts
            yet.
          </p>
        )}
      </div>

      <ul className="space-y-2">
        {earners.slice(0, 5).map((earner, index) => {
          const row = (
            <div
              className={cn(
                "flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--glass)] px-4 py-3",
                hasLiveEarners &&
                  "transition-colors hover:bg-[var(--surface-elevated)]",
              )}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="text-sm font-bold tabular-nums text-[var(--muted)]">
                  {index + 1}.
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-semibold">{earner.displayName}</p>
                    {!hasLiveEarners ? (
                      <span className="rounded-md bg-[var(--surface)] px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-[var(--muted)] uppercase">
                        Sample
                      </span>
                    ) : null}
                  </div>
                  <p className="truncate text-xs text-[var(--muted-foreground)]">
                    {hasLiveEarners
                      ? `@${earner.username}${earner.headline ? ` · ${earner.headline}` : ""}`
                      : earner.headline}
                  </p>
                </div>
              </div>
              <p className="shrink-0 text-sm font-semibold text-[var(--accent)]">
                {hasLiveEarners ? earner.earningsLabel : "—"}
              </p>
            </div>
          );

          return (
            <li key={earner.username}>
              {hasLiveEarners ? (
                <Link href={ROUTES.publicProfile(earner.username)}>{row}</Link>
              ) : (
                row
              )}
            </li>
          );
        })}
      </ul>

      {hasLiveEarners ? (
        <Button asChild variant="secondary" className="w-full">
          <Link href={ROUTES.marketplace}>Browse marketplace</Link>
        </Button>
      ) : (
        <div className="flex flex-col gap-2">
          <Button asChild className="w-full">
            <Link href={sellHref}>Start selling on Smitvi</Link>
          </Button>
          <Button asChild variant="secondary" className="w-full">
            <Link href={ROUTES.marketplace}>View example offers</Link>
          </Button>
        </div>
      )}
    </aside>
  );
}
