import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type MarketingVisualId =
  | "about"
  | "contact"
  | "legal"
  | "twin"
  | "marketplace"
  | "consultations"
  | "chat"
  | "pricing"
  | "network"
  | "experts"
  | "journey";

type MarketingVisualProps = {
  id: MarketingVisualId;
  className?: string;
  compact?: boolean;
};

function IllustrationFrame({
  children,
  className,
  label,
}: {
  children: ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]/90 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.35)]",
        "before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_30%_20%,var(--accent-soft),transparent_55%)]",
        className,
      )}
      role="img"
      aria-label={label}
    >
      <div className="relative aspect-[4/3] w-full p-6 sm:p-8">{children}</div>
    </div>
  );
}

export function MarketingVisual({ id, className, compact }: MarketingVisualProps) {
  const frameClass = compact ? "max-w-sm mx-auto" : undefined;

  switch (id) {
    case "about":
      return (
        <IllustrationFrame label="Global expert network" className={cn(frameClass, className)}>
          <svg viewBox="0 0 400 300" className="h-full w-full" fill="none">
            <circle cx="200" cy="150" r="88" stroke="var(--accent)" strokeOpacity="0.35" strokeWidth="1.5" />
            <ellipse cx="200" cy="150" rx="130" ry="48" stroke="var(--accent)" strokeOpacity="0.2" strokeWidth="1" />
            <path d="M70 150 Q200 60 330 150 Q200 240 70 150" stroke="var(--accent)" strokeOpacity="0.25" strokeWidth="1" />
            {[
              [200, 150],
              [120, 110],
              [280, 110],
              [280, 190],
              [120, 190],
            ].map(([cx, cy], i) => (
              <g key={i}>
                <circle cx={cx} cy={cy} r="14" fill="var(--accent)" fillOpacity={i === 0 ? 0.9 : 0.5} />
                <circle cx={cx} cy={cy} r="22" stroke="var(--accent)" strokeOpacity="0.35" />
              </g>
            ))}
            <path
              d="M200 62 L208 82 L200 78 L192 82 Z"
              fill="var(--accent)"
              fillOpacity="0.7"
            />
          </svg>
        </IllustrationFrame>
      );
    case "contact":
      return (
        <IllustrationFrame label="Contact and support" className={cn(frameClass, className)}>
          <svg viewBox="0 0 400 300" className="h-full w-full" fill="none">
            <rect x="60" y="80" width="280" height="160" rx="20" fill="var(--accent-soft)" stroke="var(--accent)" strokeOpacity="0.4" strokeWidth="1.5" />
            <path d="M60 100 L200 175 L340 100" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" />
            <circle cx="300" cy="70" r="28" fill="var(--accent)" fillOpacity="0.85" />
            <path d="M290 70 L298 78 L312 62" stroke="var(--accent-foreground)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </IllustrationFrame>
      );
    case "legal":
      return (
        <IllustrationFrame label="Trust and policies" className={cn(frameClass, className)}>
          <svg viewBox="0 0 400 300" className="h-full w-full" fill="none">
            <path
              d="M200 50 L280 85 V155 C280 205 200 245 200 245 C200 245 120 205 120 155 V85 Z"
              fill="var(--accent-soft)"
              stroke="var(--accent)"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path d="M165 155 L188 178 L240 120" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="250" y="170" width="90" height="110" rx="8" fill="var(--surface-elevated)" stroke="var(--border)" />
            <path d="M265 195 H325 M265 215 H310 M265 235 H320" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </IllustrationFrame>
      );
    case "twin":
      return (
        <IllustrationFrame label="AI Twin training" className={cn(frameClass, className)}>
          <svg viewBox="0 0 400 300" className="h-full w-full" fill="none">
            <rect x="55" y="70" width="120" height="150" rx="14" fill="var(--surface-elevated)" stroke="var(--border)" />
            <path d="M75 100 H155 M75 125 H140 M75 150 H150" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" />
            <path d="M195 145 H240" stroke="var(--accent)" strokeWidth="2" strokeDasharray="6 6" />
            <circle cx="290" cy="145" r="52" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="2" />
            <circle cx="290" cy="130" r="10" fill="var(--accent)" />
            <path d="M265 175 Q290 188 315 175" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M270 95 L290 75 L310 95" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" />
          </svg>
        </IllustrationFrame>
      );
    case "marketplace":
      return (
        <IllustrationFrame label="Marketplace listings" className={cn(frameClass, className)}>
          <svg viewBox="0 0 400 300" className="h-full w-full" fill="none">
            <rect x="70" y="60" width="260" height="180" rx="16" fill="var(--accent-soft)" stroke="var(--accent)" strokeOpacity="0.35" />
            <rect x="95" y="90" width="100" height="70" rx="10" fill="var(--surface)" stroke="var(--border)" />
            <rect x="210" y="90" width="95" height="28" rx="6" fill="var(--accent)" fillOpacity="0.75" />
            <rect x="210" y="128" width="70" height="12" rx="4" fill="var(--muted)" fillOpacity="0.4" />
            <circle cx="145" cy="200" r="22" fill="var(--accent)" />
            <path d="M135 200 H155 M145 190 V210" stroke="var(--accent-foreground)" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </IllustrationFrame>
      );
    case "consultations":
      return (
        <IllustrationFrame label="Live consultations" className={cn(frameClass, className)}>
          <svg viewBox="0 0 400 300" className="h-full w-full" fill="none">
            <rect x="80" y="55" width="240" height="170" rx="18" fill="var(--surface-elevated)" stroke="var(--border)" strokeWidth="1.5" />
            <circle cx="145" cy="130" r="28" fill="var(--accent-soft)" stroke="var(--accent)" />
            <circle cx="255" cy="130" r="28" fill="var(--accent)" fillOpacity="0.85" />
            <rect x="120" y="185" width="160" height="22" rx="11" fill="var(--accent-soft)" />
            <rect x="300" y="75" width="56" height="56" rx="12" fill="var(--accent)" fillOpacity="0.9" />
            <path d="M318 95 V111 M310 103 H326" stroke="var(--accent-foreground)" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </IllustrationFrame>
      );
    case "chat":
      return (
        <IllustrationFrame label="Twin chat" className={cn(frameClass, className)}>
          <svg viewBox="0 0 400 300" className="h-full w-full" fill="none">
            <rect x="60" y="55" width="200" height="56" rx="16" fill="var(--surface-elevated)" stroke="var(--border)" />
            <rect x="140" y="125" width="200" height="56" rx="16" fill="var(--accent-soft)" stroke="var(--accent)" strokeOpacity="0.4" />
            <rect x="80" y="195" width="170" height="48" rx="14" fill="var(--surface-elevated)" stroke="var(--border)" />
            <circle cx="320" cy="210" r="32" fill="var(--accent)" />
            <path d="M308 210 L316 218 L334 200" stroke="var(--accent-foreground)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </IllustrationFrame>
      );
    case "pricing":
      return (
        <IllustrationFrame label="Plans and growth" className={cn(frameClass, className)}>
          <svg viewBox="0 0 400 300" className="h-full w-full" fill="none">
            {[0, 1, 2].map((i) => (
              <rect
                key={i}
                x={90 + i * 70}
                y={160 - i * 35}
                width="80"
                height={100 + i * 35}
                rx="12"
                fill={i === 1 ? "var(--accent)" : "var(--accent-soft)"}
                fillOpacity={i === 1 ? 0.85 : 0.6}
                stroke="var(--accent)"
                strokeOpacity={i === 1 ? 1 : 0.35}
              />
            ))}
            <path d="M90 230 Q200 180 310 120" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="310" cy="120" r="8" fill="var(--accent)" />
          </svg>
        </IllustrationFrame>
      );
    case "network":
      return (
        <IllustrationFrame label="Intelligence network" className={cn(frameClass, className)}>
          <svg viewBox="0 0 400 300" className="h-full w-full" fill="none">
            <path d="M80 220 C140 160 180 140 200 120 S260 80 320 70" stroke="var(--accent)" strokeWidth="2" strokeOpacity="0.5" />
            <path d="M60 120 C120 150 160 180 200 200 S280 230 340 240" stroke="var(--accent)" strokeWidth="1.5" strokeOpacity="0.35" />
            {[
              [80, 220],
              [200, 120],
              [320, 70],
              [200, 200],
              [340, 240],
            ].map(([cx, cy], i) => (
              <circle key={i} cx={cx} cy={cy} r={i === 1 ? 12 : 8} fill="var(--accent)" fillOpacity={0.7 + i * 0.05} />
            ))}
          </svg>
        </IllustrationFrame>
      );
    case "experts":
      return (
        <IllustrationFrame label="Experts and creators" className={cn(frameClass, className)}>
          <svg viewBox="0 0 400 300" className="h-full w-full" fill="none">
            <rect x="50" y="80" width="300" height="140" rx="20" fill="url(#expertsGrad)" fillOpacity="0.15" />
            <defs>
              <linearGradient id="expertsGrad" x1="0" y1="0" x2="1" y2="1">
                <stop stopColor="var(--accent)" />
                <stop offset="1" stopColor="#0ea5e9" />
              </linearGradient>
            </defs>
            {[100, 200, 300].map((x, i) => (
              <g key={x}>
                <circle cx={x} cy="130" r="32" fill="var(--accent)" fillOpacity={0.35 + i * 0.2} />
                <rect x={x - 40} y="175" width="80" height="10" rx="5" fill="var(--muted)" fillOpacity="0.35" />
              </g>
            ))}
          </svg>
        </IllustrationFrame>
      );
    case "journey":
      return (
        <IllustrationFrame label="Three step journey" className={cn(frameClass, className)}>
          <svg viewBox="0 0 400 300" className="h-full w-full" fill="none">
            <path d="M70 200 H330" stroke="var(--accent)" strokeOpacity="0.3" strokeWidth="2" strokeDasharray="8 8" />
            {[70, 200, 330].map((x, i) => (
              <g key={x}>
                <circle cx={x} cy="200" r="28" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="2" />
                <text x={x} y="206" textAnchor="middle" fill="var(--accent)" fontSize="14" fontWeight="700">
                  {i + 1}
                </text>
                <rect x={x - 35} y="120" width="70" height="50" rx="10" fill="var(--surface-elevated)" stroke="var(--border)" />
              </g>
            ))}
          </svg>
        </IllustrationFrame>
      );
    default:
      return null;
  }
}
