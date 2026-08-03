import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function HomeSearch() {
  return (
    <form action="/search" className="animate-fade-up-delay-2 mt-4 w-full max-w-lg">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
        <Input
          name="q"
          placeholder="Search experts, skills, topics…"
          className="h-12 border-[var(--glass-border)] bg-[var(--glass)] pr-[6.5rem] pl-10 shadow-[var(--glass-shadow)] backdrop-blur-xl"
          aria-label="Search Smitvi"
        />
        <Button
          type="submit"
          size="sm"
          className="absolute top-1/2 right-1.5 h-9 -translate-y-1/2 px-4"
        >
          Search
        </Button>
      </div>
    </form>
  );
}
