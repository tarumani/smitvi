import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { ApiKeysPanel } from "@/components/settings/api-keys-panel";
import { getEntitlements } from "@/domain/billing/entitlements";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/constants";

export const metadata: Metadata = {
  title: "API keys",
};

export default async function ApiKeysSettingsPage() {
  const session = await getCurrentSession();
  if (!session) redirect(ROUTES.login);

  const entitlements = getEntitlements(session.user.plan);
  const keys = await container.apiKeys.listForUser(session.user.id);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            API keys
          </h1>
          <p className="mt-2 text-[var(--muted-foreground)]">
            Authenticate against the Smitvi Public API with Bearer tokens.
          </p>
        </div>
        <Button asChild variant="secondary">
          <Link href={ROUTES.developers}>Developer docs</Link>
        </Button>
      </div>

      <ApiKeysPanel
        canCreate={entitlements.publicApi}
        keys={keys.map((key) => ({
          ...key,
          lastUsedAt: key.lastUsedAt,
          revokedAt: key.revokedAt,
          createdAt: key.createdAt,
        }))}
      />
    </div>
  );
}
