"use client";

import type { ReactNode } from "react";
import { openCookiePreferences } from "@/lib/cookie-consent";

type Props = {
  className?: string;
  children?: ReactNode;
};

export function CookieSettingsLink({
  className,
  children = "Cookie settings",
}: Props) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => openCookiePreferences()}
    >
      {children}
    </button>
  );
}
