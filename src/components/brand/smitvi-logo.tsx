import Link from "next/link";
import { APP_NAME, ROUTES } from "@/config/constants";
import { cn } from "@/lib/utils";

type SmitviLogoProps = {
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
  href?: string | null;
  size?: "sm" | "md" | "lg";
};

const SIZE = {
  sm: { mark: "h-7 w-7", text: "text-lg" },
  md: { mark: "h-8 w-8", text: "text-xl" },
  lg: { mark: "h-10 w-10", text: "text-2xl" },
} as const;

function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      fill="none"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <rect width="64" height="64" rx="16" fill="#0F766E" />
      <path
        d="M44 20.5c0-4.6-3.9-8-9.8-8-5.2 0-9.2 2.6-10.4 6.6"
        stroke="#F8FFFE"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M23.8 26.2c1.4-3.2 4.8-5.2 9.4-5.2 5.6 0 8.8 2.7 8.8 6.2 0 3.3-2.2 5.1-8.2 6.7-6.4 1.7-10.2 4.4-10.2 9.4 0 5.2 4.4 8.7 11 8.7 5.4 0 9.4-2.6 10.8-6.8"
        stroke="#F8FFFE"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="24.2" cy="19.8" r="3.1" fill="#F8FFFE" />
      <circle cx="40.8" cy="27.6" r="3.1" fill="#F8FFFE" />
      <circle cx="23.6" cy="37.4" r="3.1" fill="#F8FFFE" />
      <circle cx="41.2" cy="45.8" r="3.1" fill="#F8FFFE" />
    </svg>
  );
}

export function SmitviLogo({
  className,
  markClassName,
  showWordmark = true,
  href = ROUTES.home,
  size = "md",
}: SmitviLogoProps) {
  const sizing = SIZE[size];
  const content = (
    <>
      <LogoMark className={cn(sizing.mark, markClassName)} />
      {showWordmark ? (
        <span
          className={cn(
            "font-display font-extrabold tracking-tight",
            sizing.text,
          )}
        >
          {APP_NAME}
        </span>
      ) : (
        <span className="sr-only">{APP_NAME}</span>
      )}
    </>
  );

  if (href === null) {
    return (
      <span className={cn("inline-flex items-center gap-2.5", className)}>
        {content}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2.5 transition-opacity hover:opacity-85",
        className,
      )}
    >
      {content}
    </Link>
  );
}
