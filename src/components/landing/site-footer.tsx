import Link from "next/link";
import { Instagram, Linkedin } from "lucide-react";
import { SmitviLogo } from "@/components/brand/smitvi-logo";
import { CookieSettingsLink } from "@/components/marketing/cookie-settings-link";
import {
  APP_NAME,
  APP_TAGLINE,
  ROUTES,
  SOCIAL_LINKS,
} from "@/config/constants";

const PRODUCT_LINKS = [
  { href: ROUTES.discover, label: "Discover" },
  { href: ROUTES.marketplace, label: "Marketplace" },
  { href: ROUTES.guides, label: "Guides" },
  { href: ROUTES.howItHelps, label: "How it helps" },
  { href: ROUTES.search, label: "Search" },
  { href: ROUTES.pricing, label: "Pricing" },
  { href: ROUTES.productTrainTwin, label: "Train your Twin" },
] as const;

const COMPANY_LINKS = [
  { href: ROUTES.about, label: "About" },
  { href: ROUTES.contact, label: "Contact" },
  { href: ROUTES.signup, label: "Create Twin" },
  { href: ROUTES.login, label: "Sign in" },
] as const;

const LEGAL_LINKS = [
  { href: ROUTES.privacy, label: "Privacy" },
  { href: ROUTES.terms, label: "Terms" },
  { href: ROUTES.disclaimer, label: "Disclaimer" },
] as const;

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  );
}

function SocialIcon({ id, className }: { id: string; className?: string }) {
  if (id === "x") return <XIcon className={className} />;
  if (id === "instagram") return <Instagram className={className} aria-hidden />;
  if (id === "linkedin") return <Linkedin className={className} aria-hidden />;
  return null;
}

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
          <ul className="mt-5 flex items-center gap-2">
            {SOCIAL_LINKS.map((link) => (
              <li key={link.id}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.label}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--border)] text-[var(--muted-foreground)] transition-colors hover:border-[var(--foreground)]/20 hover:text-[var(--foreground)]"
                >
                  <SocialIcon id={link.id} className="h-4 w-4" />
                </a>
              </li>
            ))}
          </ul>
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
            <CookieSettingsLink className="hover:text-[var(--foreground)]" />
            <span>Human intelligence, indexed.</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
