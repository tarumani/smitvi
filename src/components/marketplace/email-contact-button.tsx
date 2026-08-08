"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type EmailContactButtonProps = {
  email: string;
  subject: string;
  label: string;
  variant?: "default" | "secondary";
};

/** mailto: often does nothing without a default mail app — copy email as fallback. */
export function EmailContactButton({
  email,
  subject,
  label,
  variant = "default",
}: EmailContactButtonProps) {
  function onClick() {
    const trimmed = email.trim();
    if (!trimmed) {
      toast.error("No email on file for this user.");
      return;
    }

    const mailto = `mailto:${trimmed}?subject=${encodeURIComponent(subject)}`;
    const link = document.createElement("a");
    link.href = mailto;
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    link.remove();

    void navigator.clipboard.writeText(trimmed).then(
      () => {
        toast.success("Email copied", {
          description: `If your mail app did not open, paste ${trimmed} into Gmail or Outlook.`,
        });
      },
      () => {
        toast.message("Contact", {
          description: `${trimmed} — paste into your email app.`,
        });
      },
    );
  }

  return (
    <Button type="button" variant={variant} size="sm" onClick={onClick}>
      {label}
    </Button>
  );
}
