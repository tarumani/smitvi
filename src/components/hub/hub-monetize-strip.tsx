import Link from "next/link";
import { ROUTES } from "@/config/constants";
import { Button } from "@/components/ui/button";

type Props = {
  username: string;
  twinEnabled: boolean;
  listingCount: number;
};

export function HubMonetizeStrip({
  username,
  twinEnabled,
  listingCount,
}: Props) {
  return (
    <div className="flex flex-wrap gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)]/60 p-4">
      <Button asChild size="sm" variant="secondary">
        <Link href={ROUTES.publicTwinChat(username)}>Ask AI</Link>
      </Button>
      <Button asChild size="sm" variant="outline">
        <Link href={ROUTES.publicStore(username)}>Products ({listingCount})</Link>
      </Button>
      <Button asChild size="sm" variant="outline">
        <Link href={`${ROUTES.publicProfile(username)}#hub-tab-book`}>
          Book consultation
        </Link>
      </Button>
      {twinEnabled ? (
        <Button asChild size="sm" variant="ghost">
          <Link href={ROUTES.publicTwinChat(username)}>Subscribe / paid access</Link>
        </Button>
      ) : null}
    </div>
  );
}
