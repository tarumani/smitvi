import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { Hanken_Grotesk } from "next/font/google";
import { cookies } from "next/headers";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { THEME_STORAGE_KEY } from "@/components/providers/theme-script";
import { RegisterServiceWorker } from "@/components/pwa/register-sw";
import { AdSenseScriptLoader } from "@/components/marketing/adsense-script-loader";
import { GoogleAnalytics } from "@/components/marketing/google-analytics";
import { CookieConsentBanner } from "@/components/marketing/cookie-consent-banner";
import { APP_VISION } from "@/config/brand";
import { APP_NAME, APP_TAGLINE, TRAIN_TWIN_LABEL } from "@/config/constants";
import { ADSENSE_CLIENT, ADSENSE_ENABLED } from "@/config/adsense";
import { Toaster } from "sonner";
import "./globals.css";

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
  description: `${APP_TAGLINE} ${APP_VISION} ${TRAIN_TWIN_LABEL} and marketplace on ${APP_NAME}.`,
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
  other: ADSENSE_ENABLED
    ? { "google-adsense-account": ADSENSE_CLIENT }
    : undefined,
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
          <CookieConsentBanner />
          <GoogleAnalytics />
          <AdSenseScriptLoader />
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
