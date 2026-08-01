/**
 * Full-bleed product atmosphere: a living intelligence network.
 * Reads as Smitvi's core metaphor — indexed minds connected by knowledge.
 */
export function HeroVisual() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div className="absolute inset-0 hero-mesh" />
      <div className="absolute -right-[12%] top-[-8%] h-[70%] w-[70%] rounded-full bg-[radial-gradient(circle,rgba(15,118,110,0.22)_0%,transparent_68%)] blur-2xl dark:bg-[radial-gradient(circle,rgba(45,212,191,0.16)_0%,transparent_68%)]" />
      <div className="absolute -left-[10%] bottom-[-20%] h-[55%] w-[55%] rounded-full bg-[radial-gradient(circle,rgba(14,165,233,0.14)_0%,transparent_70%)] blur-2xl" />

      <svg
        className="absolute inset-0 h-full w-full opacity-[0.55] dark:opacity-40"
        viewBox="0 0 1440 900"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <g stroke="currentColor" className="text-[var(--accent)]" strokeWidth="1">
          <path
            className="animate-draw-line"
            d="M180 620 C320 520, 420 480, 560 430 S820 310, 980 280 S1240 250, 1320 220"
            strokeOpacity="0.35"
          />
          <path
            className="animate-draw-line-delay"
            d="M120 240 C280 300, 400 360, 540 400 S820 470, 980 520 S1200 610, 1360 680"
            strokeOpacity="0.25"
          />
          <path
            d="M260 160 C400 220, 520 340, 640 420 S900 560, 1080 620"
            strokeOpacity="0.18"
          />
        </g>

        {[
          [220, 250],
          [420, 380],
          [640, 420],
          [860, 300],
          [1040, 500],
          [1220, 240],
          [980, 620],
          [520, 180],
          [740, 560],
        ].map(([cx, cy], index) => (
          <g key={`${cx}-${cy}`}>
            <circle
              cx={cx}
              cy={cy}
              r={index % 3 === 0 ? 7 : 4.5}
              className="fill-[var(--accent)] animate-node-pulse"
              style={{ animationDelay: `${index * 0.35}s` }}
              opacity={0.85}
            />
            <circle
              cx={cx}
              cy={cy}
              r={18}
              className="stroke-[var(--accent)] fill-none animate-pulse-ring"
              style={{ animationDelay: `${index * 0.45}s` }}
              strokeOpacity="0.35"
            />
          </g>
        ))}
      </svg>

      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[var(--background)] to-transparent" />
    </div>
  );
}
