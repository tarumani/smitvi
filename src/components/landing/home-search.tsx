import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function HomeSearch() {
  return (
    <form
      action="/search"
      className="animate-fade-up-delay-2 mt-5 w-full max-w-xl"
    >
      <label className="mb-2 block text-xs font-semibold tracking-[0.14em] text-[var(--accent)] uppercase">
        Search the network
      </label>
      <div className="relative rounded-2xl bg-gradient-to-r from-[var(--accent)]/35 via-sky-400/25 to-[var(--accent)]/20 p-[2px] shadow-[0_12px_40px_rgba(15,118,110,0.22)] transition-shadow focus-within:shadow-[0_16px_48px_rgba(15,118,110,0.32)]">
        <div className="relative rounded-[0.9rem] bg-[var(--surface-elevated)]">
          <Search className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-[var(--accent)]" />
          <Input
            name="q"
            placeholder="Search experts, skills, topics…"
            className="h-14 border-0 bg-transparent pr-[7rem] pl-12 text-base shadow-none ring-0 focus-visible:ring-0"
            aria-label="Search Smitvi"
          />
          <Button
            type="submit"
            className="absolute top-1/2 right-2 h-10 -translate-y-1/2 px-5 font-semibold"
          >
            Search
          </Button>
        </div>
      </div>
    </form>
  );
}
