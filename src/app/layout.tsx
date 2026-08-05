import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Hanken_Grotesk } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { THEME_STORAGE_KEY } from "@/components/providers/theme-script";
import { RegisterServiceWorker } from "@/components/pwa/register-sw";
import { APP_NAME, APP_OUTCOME, APP_TAGLINE, TRAIN_TWIN_LABEL } from "@/config/constants";
import { Toaster } from "sonner";
import "./globals.css";

/** Free for commercial use (SIL OFL 1.1) via Google Fonts. */
const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans-family",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — ${APP_TAGLINE}`,
    template: `%s · ${APP_NAME}`,
  },
  description: `${APP_OUTCOME} ${TRAIN_TWIN_LABEL}, public profile, marketplace, and consultations on ${APP_NAME}.`,
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  applicationName: APP_NAME,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: APP_NAME,
    description: APP_TAGLINE,
    type: "website",
  },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f7fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1017" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
};

function parseThemeCookie(value: string | undefined): "light" | "dark" | "system" {
  if (value === "light" || value === "dark" || value === "system") return value;
  return "system";
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const theme = parseThemeCookie(cookieStore.get(THEME_STORAGE_KEY)?.value);
  // For "system", leave class empty and let CSS + client resolve — no script tag.
  const htmlThemeClass = theme === "system" ? undefined : theme;

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={["h-full", htmlThemeClass].filter(Boolean).join(" ")}
      style={
        htmlThemeClass
          ? ({ colorScheme: htmlThemeClass } satisfies CSSProperties)
          : undefined
      }
    >
      <body
        className={`${hankenGrotesk.variable} app-atmosphere min-h-full font-sans antialiased`}
      >
        <ThemeProvider initialTheme={theme} disableTransitionOnChange>
          {children}
          <RegisterServiceWorker />
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
