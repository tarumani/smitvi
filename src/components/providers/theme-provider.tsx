"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { THEME_STORAGE_KEY } from "@/components/providers/theme-script";

export type Theme = "light" | "dark" | "system";

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyThemeClass(resolved: "light" | "dark") {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
  root.style.colorScheme = resolved;
}

function writeThemeCookie(theme: Theme) {
  // 1 year — readable by the root layout on the next request (no FOUC script).
  document.cookie = `${THEME_STORAGE_KEY}=${encodeURIComponent(theme)};path=/;max-age=31536000;samesite=lax`;
}

function subscribeSystemTheme(onStoreChange: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

type ThemeProviderProps = {
  children: ReactNode;
  initialTheme?: Theme;
  disableTransitionOnChange?: boolean;
};

export function ThemeProvider({
  children,
  initialTheme = "system",
  disableTransitionOnChange = false,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(initialTheme);
  const systemTheme = useSyncExternalStore(
    subscribeSystemTheme,
    getSystemTheme,
    () => "light" as const,
  );

  const resolvedTheme: "light" | "dark" =
    theme === "system" ? systemTheme : theme;

  useEffect(() => {
    if (disableTransitionOnChange) {
      const style = document.createElement("style");
      style.textContent =
        "*,*::before,*::after{-webkit-transition:none!important;transition:none!important}";
      document.head.appendChild(style);
      applyThemeClass(resolvedTheme);
      void document.body?.offsetHeight;
      style.remove();
      return;
    }
    applyThemeClass(resolvedTheme);
  }, [resolvedTheme, disableTransitionOnChange]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // ignore storage errors
    }
    writeThemeCookie(next);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
