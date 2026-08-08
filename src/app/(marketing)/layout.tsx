import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { MarketingPageFooterAd } from "@/components/marketing/marketing-page-footer-ad";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-full flex-col">
      <SiteHeader />
      <main className="relative flex-1 overflow-x-hidden">{children}</main>
      <MarketingPageFooterAd />
      <SiteFooter />
    </div>
  );
}
