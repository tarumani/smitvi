import { toast } from "sonner";

/** Avoid blank Sonner toasts when API/Supabase returns empty messages. */
export function toastAuthError(title: string, detail?: string) {
  const heading = title.trim() || "Something went wrong";
  const body = detail?.trim() ?? "";
  if (!body || body === "{}" || body === heading) {
    toast.error(heading);
    return;
  }
  toast.error(heading, { description: body });
}
