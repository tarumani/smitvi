import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function HomeSearch() {
  return (
    <form
      action="/search"
      className="animate-fade-up-delay-2 mt-4 flex w-full max-w-lg flex-col gap-2 sm:flex-row"
    >
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
        <Input
          name="q"
          placeholder="Search experts, skills, topics…"
          className="h-11 border-[var(--glass-border)] bg-[var(--glass)] pl-10 shadow-[var(--glass-shadow)] backdrop-blur-xl"
          aria-label="Search Smitvi"
        />
      </div>
      <Button type="submit" size="lg" variant="secondary" className="h-11 px-5">
        Search
      </Button>
    </form>
  );
}
