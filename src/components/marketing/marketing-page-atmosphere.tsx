/** Soft background motif for marketing / info pages. */
export function MarketingPageAtmosphere() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -right-[20%] top-0 h-[55%] w-[55%] rounded-full bg-[radial-gradient(circle,var(--accent-soft)_0%,transparent_68%)] opacity-80" />
      <div className="absolute -left-[15%] bottom-0 h-[45%] w-[45%] rounded-full bg-[radial-gradient(circle,rgba(14,165,233,0.12)_0%,transparent_70%)]" />
      <div
        className="absolute inset-0 opacity-[0.25] [background-image:radial-gradient(rgba(15,23,42,0.07)_1px,transparent_1px)] [background-size:24px_24px] dark:opacity-[0.15]"
      />
    </div>
  );
}
