import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn, initials } from "@/lib/utils";

type AvatarProps = {
  src?: string | null;
  name: string;
  className?: string;
};

export function Avatar({ src, name, className }: AvatarProps) {
  return (
    <AvatarPrimitive.Root
      className={cn(
        "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full border border-[var(--border)] bg-[var(--surface-elevated)]",
        className,
      )}
    >
      {src ? (
        <AvatarPrimitive.Image
          src={src}
          alt={name}
          className="aspect-square h-full w-full object-cover"
        />
      ) : null}
      <AvatarPrimitive.Fallback className="flex h-full w-full items-center justify-center bg-[var(--accent-soft)] text-sm font-semibold text-[var(--accent)]">
        {initials(name)}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}
