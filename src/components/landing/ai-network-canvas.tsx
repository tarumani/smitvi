import { cn } from "@/lib/utils";

type AiNetworkCanvasProps = {
  className?: string;
};

/** Soft intelligence-graph motif for corporate AI hero compositions. */
export function AiNetworkCanvas({ className }: AiNetworkCanvasProps) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <svg
        viewBox="0 0 640 720"
        className="h-full w-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="ai-line" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgb(15 118 110)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="rgb(14 165 233)" stopOpacity="0.2" />
          </linearGradient>
          <radialGradient id="ai-node" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgb(15 118 110)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="rgb(15 118 110)" stopOpacity="0" />
          </radialGradient>
        </defs>

        <g stroke="url(#ai-line)" strokeWidth="1.25">
          <path className="animate-draw-line" d="M80 120 L220 180 L320 140 L460 210 L560 160" />
          <path
            className="animate-draw-line-delay"
            d="M100 420 L240 340 L320 400 L480 320 L580 380"
          />
          <path d="M160 560 L280 480 L360 540 L500 470" opacity="0.55" />
          <path d="M220 180 L240 340 L280 480" opacity="0.4" />
          <path d="M320 140 L320 400 L360 540" opacity="0.35" />
          <path d="M460 210 L480 320 L500 470" opacity="0.4" />
        </g>

        {[
          [80, 120],
          [220, 180],
          [320, 140],
          [460, 210],
          [560, 160],
          [100, 420],
          [240, 340],
          [320, 400],
          [480, 320],
          [580, 380],
          [160, 560],
          [280, 480],
          [360, 540],
          [500, 470],
        ].map(([x, y], i) => (
          <g key={`${x}-${y}`}>
            <circle cx={x} cy={y} r="18" fill="url(#ai-node)" className="animate-node-pulse" style={{ animationDelay: `${i * 0.12}s` }} />
            <circle cx={x} cy={y} r="3.5" fill="rgb(15 118 110)" opacity="0.85" />
          </g>
        ))}
      </svg>
    </div>
  );
}
