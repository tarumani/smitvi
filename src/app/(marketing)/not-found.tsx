import Link from "next/link";
import { PageHero } from "@/components/layout/page-hero";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/constants";

export default function MarketingNotFound() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-20 sm:px-6">
      <PageHero
        eyebrow="404"
        title="Page not found"
        description="That link may be outdated — try Discover, Search, or one of the product guides below."
        actions={
          <>
            <Button asChild>
              <Link href={ROUTES.home}>Home</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href={ROUTES.discover}>Discover</Link>
            </Button>
          </>
        }
      />
      <ul className="mt-10 grid gap-2 text-sm text-[var(--muted-foreground)] sm:grid-cols-2">
        <li>
          <Link href={ROUTES.search} className="hover:text-[var(--accent)]">
            Search the network
          </Link>
        </li>
        <li>
          <Link href={ROUTES.marketplace} className="hover:text-[var(--accent)]">
            Marketplace
          </Link>
        </li>
        <li>
          <Link href={ROUTES.productTrainTwin} className="hover:text-[var(--accent)]">
            Train your AI Twin
          </Link>
        </li>
        <li>
          <Link href={ROUTES.contact} className="hover:text-[var(--accent)]">
            Contact support
          </Link>
        </li>
      </ul>
    </div>
  );
}
