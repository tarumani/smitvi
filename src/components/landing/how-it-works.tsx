const steps = [
  {
    step: "01",
    title: "Claim your identity",
    description:
      "Create your profile and @username — the public home of your Knowledge Twin.",
  },
  {
    step: "02",
    title: "Upload your mind",
    description:
      "Bring PDFs, repos, Notion, Drive, YouTube, and more into a private intelligence graph.",
  },
  {
    step: "03",
    title: "Launch and earn",
    description:
      "Open public chat, courses, and consultations from one expert surface.",
  },
] as const;

export function HowItWorks() {
  return (
    <section
      id="how"
      className="relative overflow-hidden border-y border-[var(--border)]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(15,118,110,0.06),transparent_45%,rgba(14,165,233,0.05))]" />
      <div className="relative mx-auto w-full max-w-6xl px-4 py-24 sm:px-6 lg:py-32">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold tracking-[0.18em] text-[var(--accent)] uppercase">
            How it works
          </p>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-5xl">
            From expertise to Twin in three steps
          </h2>
        </div>

        <ol className="mt-16 grid gap-12 md:grid-cols-3 md:gap-8">
          {steps.map((item, index) => (
            <li key={item.step} className="relative">
              {index < steps.length - 1 ? (
                <span
                  aria-hidden="true"
                  className="absolute top-8 left-[calc(100%+0.25rem)] hidden h-px w-[calc(100%-2rem)] bg-gradient-to-r from-[var(--accent)]/55 to-transparent md:block"
                />
              ) : null}
              <p className="font-display text-5xl font-extrabold tracking-tight text-[var(--accent)]/20">
                {item.step}
              </p>
              <h3 className="mt-3 font-display text-xl font-semibold tracking-tight">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)] sm:text-base">
                {item.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
