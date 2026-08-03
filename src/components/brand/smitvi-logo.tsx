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

/** Hexagon + growth chart mark shared with smitviai.com branding. */
function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      fill="none"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <rect width="64" height="64" rx="14" fill="#141821" />
      <path
        d="M32 11.5L49.5 21.5V42.5L32 52.5L14.5 42.5V21.5L32 11.5Z"
        stroke="#2DFF6E"
        strokeWidth="3.2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d="M20 43L26.5 35.5L31 40L39.5 26.5L43.5 31.5L48 20"
        stroke="#F4FFFB"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
