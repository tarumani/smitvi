import Link from "next/link";
import { ArrowRight, MessageSquare, Share2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { ROUTES } from "@/config/constants";

type Props = {
  username: string;
  readyCount: number;
  processingCount: number;
};

export function KnowledgeNextSteps({
  username,
  readyCount,
  processingCount,
}: Props) {
  const twinLive = readyCount > 0;

  return (
    <GlassCard
      id="training-sources"
      className="scroll-mt-24 border-[var(--accent)]/25 bg-[var(--accent-soft)]/15 p-5 sm:p-6"
    >
      <p className="text-xs font-semibold tracking-wide text-[var(--accent)] uppercase">
        What to do next
      </p>
      <h2 className="mt-1 font-display text-lg font-semibold tracking-tight">
        {twinLive
          ? "Your Twin is learning from your sources"
          : "Sources are being processed"}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
        {processingCount > 0 && !twinLive
          ? "Indexing usually takes a minute. Refresh if status stays stuck — then test chat when a source shows Ready."
          : twinLive
            ? "Ask your Twin a real question, share your hub, or add more expertise below."
            : "Add at least one source, then test chat when status is Ready."}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button asChild size="sm">
          <Link href={ROUTES.twinChat}>
            <MessageSquare className="h-4 w-4" />
            Test your Twin
          </Link>
        </Button>
        <Button asChild variant="secondary" size="sm">
          <Link href={ROUTES.publicProfile(username)}>
            <Share2 className="h-4 w-4" />
            View public hub
          </Link>
        </Button>
        <Button asChild variant="secondary" size="sm">
          <Link href="#knowledge-connect">
            <Upload className="h-4 w-4" />
            Add another source
          </Link>
        </Button>
        {twinLive ? (
          <Button asChild variant="ghost" size="sm">
            <Link href={ROUTES.marketplaceSell}>
              Sell your expertise
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        ) : null}
      </div>
    </GlassCard>
  );
}
