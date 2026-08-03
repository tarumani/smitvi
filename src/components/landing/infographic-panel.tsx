import { cn } from "@/lib/utils";

type InfographicPanelProps = {
  className?: string;
  variant?: "pipeline" | "network" | "value";
};

/** Lightweight SVG infographics for the Smitvi concept. */
export function InfographicPanel({
  className,
  variant = "pipeline",
}: InfographicPanelProps) {
  if (variant === "network") {
    return (
      <svg
        viewBox="0 0 420 280"
        className={cn("h-auto w-full", className)}
        role="img"
        aria-label="Network of Knowledge Twins connected across topics"
      >
        <rect width="420" height="280" rx="28" fill="var(--glass)" />
        <circle cx="210" cy="140" r="28" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="2" />
        <circle cx="90" cy="80" r="18" fill="var(--surface)" stroke="var(--border)" strokeWidth="2" />
        <circle cx="330" cy="70" r="18" fill="var(--surface)" stroke="var(--border)" strokeWidth="2" />
        <circle cx="80" cy="200" r="18" fill="var(--surface)" stroke="var(--border)" strokeWidth="2" />
        <circle cx="340" cy="210" r="18" fill="var(--surface)" stroke="var(--border)" strokeWidth="2" />
        <circle cx="210" cy="40" r="14" fill="var(--surface)" stroke="var(--border)" strokeWidth="2" />
        <path d="M112 90L186 126M300 82L234 122M100 188L186 154M318 198L234 158M210 54V112" stroke="var(--accent)" strokeWidth="1.5" opacity="0.55" />
        <text x="210" y="145" textAnchor="middle" fill="var(--foreground)" fontSize="11" fontWeight="700">
          Twin
        </text>
        <text x="90" y="84" textAnchor="middle" fill="var(--muted-foreground)" fontSize="9">
          Docs
        </text>
        <text x="330" y="74" textAnchor="middle" fill="var(--muted-foreground)" fontSize="9">
          Talks
        </text>
        <text x="80" y="204" textAnchor="middle" fill="var(--muted-foreground)" fontSize="9">
          Code
        </text>
        <text x="340" y="214" textAnchor="middle" fill="var(--muted-foreground)" fontSize="9">
          FAQs
        </text>
      </svg>
    );
  }

  if (variant === "value") {
    return (
      <svg
        viewBox="0 0 420 280"
        className={cn("h-auto w-full", className)}
        role="img"
        aria-label="Experts scale answers while learners get instant help"
      >
        <rect width="420" height="280" rx="28" fill="var(--glass)" />
        <rect x="36" y="48" width="140" height="184" rx="18" fill="var(--surface)" stroke="var(--border)" />
        <rect x="244" y="48" width="140" height="184" rx="18" fill="var(--surface)" stroke="var(--border)" />
        <text x="106" y="84" textAnchor="middle" fill="var(--accent)" fontSize="12" fontWeight="700">
          Expert
        </text>
        <text x="314" y="84" textAnchor="middle" fill="var(--accent)" fontSize="12" fontWeight="700">
          Learner
        </text>
        <path d="M70 120h72M70 148h56M70 176h64" stroke="var(--muted)" strokeWidth="8" strokeLinecap="round" opacity="0.35" />
        <path d="M278 120h72M278 148h48M278 176h60" stroke="var(--muted)" strokeWidth="8" strokeLinecap="round" opacity="0.35" />
        <path d="M186 140H244" stroke="var(--accent)" strokeWidth="3" markerEnd="url(#arrow)" />
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="var(--accent)" />
          </marker>
        </defs>
        <text x="210" y="128" textAnchor="middle" fill="var(--muted-foreground)" fontSize="10">
          Twin answers 24/7
        </text>
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 420 280"
      className={cn("h-auto w-full", className)}
      role="img"
      aria-label="Upload knowledge, index it, launch a Twin"
    >
      <rect width="420" height="280" rx="28" fill="var(--glass)" />
      {[
        { x: 48, label: "Upload", sub: "PDFs · notes · repos" },
        { x: 168, label: "Index", sub: "Chunks · embeddings" },
        { x: 288, label: "Launch", sub: "Chat · sell · scale" },
      ].map((node, i) => (
        <g key={node.label}>
          <rect
            x={node.x}
            y="78"
            width="92"
            height="110"
            rx="18"
            fill="var(--surface)"
            stroke={i === 2 ? "var(--accent)" : "var(--border)"}
            strokeWidth={i === 2 ? 2 : 1}
          />
          <circle
            cx={node.x + 46}
            cy="112"
            r="14"
            fill="var(--accent-soft)"
            stroke="var(--accent)"
          />
          <text
            x={node.x + 46}
            y="116"
            textAnchor="middle"
            fill="var(--accent)"
            fontSize="11"
            fontWeight="700"
          >
            {i + 1}
          </text>
          <text
            x={node.x + 46}
            y="148"
            textAnchor="middle"
            fill="var(--foreground)"
            fontSize="12"
            fontWeight="700"
          >
            {node.label}
          </text>
          <text
            x={node.x + 46}
            y="168"
            textAnchor="middle"
            fill="var(--muted-foreground)"
            fontSize="9"
          >
            {node.sub}
          </text>
          {i < 2 ? (
            <path
              d={`M${node.x + 100} 133 H${node.x + 112}`}
              stroke="var(--accent)"
              strokeWidth="2"
              opacity="0.7"
            />
          ) : null}
        </g>
      ))}
    </svg>
  );
}
