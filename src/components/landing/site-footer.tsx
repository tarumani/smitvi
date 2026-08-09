import type { ReactNode } from "react";
import Link from "next/link";
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

function SocialSvg({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      {children}
    </svg>
  );
}

function SocialIcon({ id, className }: { id: string; className?: string }) {
  if (id === "x") {
    return (
      <SocialSvg className={className}>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
      </SocialSvg>
    );
  }
  if (id === "instagram") {
    return (
      <SocialSvg className={className}>
        <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5a4.25 4.25 0 0 0 4.25-4.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5Zm8.75 1.75a1.125 1.125 0 1 1 0 2.25 1.125 1.125 0 0 1 0-2.25ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
      </SocialSvg>
    );
  }
  if (id === "linkedin") {
    return (
      <SocialSvg className={className}>
        <path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.25 8.25h4.5V23.5H.25V8.25zM8.5 8.25h4.31v2.08h.06c.6-1.14 2.07-2.34 4.26-2.34 4.56 0 5.4 3 5.4 6.9v8.61h-4.5v-7.63c0-1.82-.03-4.16-2.54-4.16-2.54 0-2.93 1.98-2.93 4.03v7.76H8.5V8.25z" />
      </SocialSvg>
    );
  }
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
