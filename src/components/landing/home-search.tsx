import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function HomeSearch() {
  return (
    <form
      action="/search"
      className="animate-fade-up-delay-2 mt-7 w-full max-w-xl"
    >
      <label className="mb-2 block text-xs font-semibold tracking-[0.14em] text-[var(--accent)] uppercase">
        Search the network
      </label>
      <div className="animate-search-sheen relative rounded-2xl bg-[linear-gradient(110deg,rgba(15,118,110,0.55),rgba(14,165,233,0.4),rgba(15,118,110,0.55))] p-[2.5px] shadow-[0_16px_44px_rgba(15,118,110,0.24)] transition-shadow focus-within:shadow-[0_20px_52px_rgba(15,118,110,0.32)]">
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
