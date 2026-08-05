import Link from "next/link";
import { SmitviLogo } from "@/components/brand/smitvi-logo";
import { APP_NAME, APP_TAGLINE, ROUTES } from "@/config/constants";

const PRODUCT_LINKS = [
  { href: ROUTES.discover, label: "Discover" },
  { href: ROUTES.marketplace, label: "Marketplace" },
  { href: ROUTES.howItHelps, label: "How it helps" },
  { href: ROUTES.search, label: "Search" },
  { href: ROUTES.pricing, label: "Pricing" },
  { href: ROUTES.productTrainTwin, label: "Train your Twin" },
] as const;

const COMPANY_LINKS = [
  { href: ROUTES.about, label: "About" },
  { href: ROUTES.contact, label: "Contact" },
  { href: ROUTES.developers, label: "Developers" },
  { href: ROUTES.signup, label: "Create Twin" },
  { href: ROUTES.login, label: "Sign in" },
] as const;

const LEGAL_LINKS = [
  { href: ROUTES.privacy, label: "Privacy" },
  { href: ROUTES.terms, label: "Terms" },
] as const;

export function SiteFooter() {
  return (
    <footer className="relative mt-auto border-t border-[var(--border)] bg-[var(--surface)]/40">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <SmitviLogo size="lg" />
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--muted-foreground)]">
            {APP_TAGLINE}. Own, organize, monetize, and scale your intelligence
            with AI.
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-[var(--muted)] uppercase">
            Product
          </p>
          <ul className="mt-4 space-y-2.5 text-sm text-[var(--muted-foreground)]">
            {PRODUCT_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="transition-colors hover:text-[var(--foreground)]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-[var(--muted)] uppercase">
            Account
          </p>
          <ul className="mt-4 space-y-2.5 text-sm text-[var(--muted-foreground)]">
            {COMPANY_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="transition-colors hover:text-[var(--foreground)]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-[var(--muted)] uppercase">
            Legal
          </p>
          <ul className="mt-4 space-y-2.5 text-sm text-[var(--muted-foreground)]">
            {LEGAL_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="transition-colors hover:text-[var(--foreground)]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-[var(--border)]">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
          <p className="flex flex-wrap gap-x-4 gap-y-1">
            <Link href={ROUTES.privacy} className="hover:text-[var(--foreground)]">
              Privacy
            </Link>
            <Link href={ROUTES.terms} className="hover:text-[var(--foreground)]">
              Terms
            </Link>
            <span>Human intelligence, indexed.</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
