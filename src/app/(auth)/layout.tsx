import type { Metadata } from "next";
import { SmitviLogo } from "@/components/brand/smitvi-logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden">
      <div className="mx-auto flex h-14 w-full max-w-6xl shrink-0 items-center justify-between px-4 sm:px-6">
        <SmitviLogo size="sm" />
        <ThemeToggle />
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center px-4 pb-4">
        {children}
      </div>
    </div>
  );
}
