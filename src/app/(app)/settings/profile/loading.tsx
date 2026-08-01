import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileSettingsLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Skeleton className="h-10 w-40" />
      <Skeleton className="h-5 w-80" />
      <Skeleton className="h-[520px] rounded-3xl" />
    </div>
  );
}
