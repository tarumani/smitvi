import Link from "next/link";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { APP_NAME, ROUTES } from "@/config/constants";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="hero-atmosphere flex min-h-full flex-col">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Link href={ROUTES.home} className="font-display text-xl font-extrabold">
          {APP_NAME}
        </Link>
        <ThemeToggle />
      </div>
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        {children}
      </div>
    </div>
  );
}
