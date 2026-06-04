import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { FirstRunOnboarding } from "@/components/FirstRunOnboarding";
import { MobileStartupSplash } from "@/components/MobileStartupSplash";
import { AndroidBackButton } from "@/components/AndroidBackButton";
import { NotificationManager } from "@/components/NotificationManager";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "رِفْق",
    template: "%s | رِفْق"
  },
  description: "رِفْق: تطبيق إسلامي للقرآن الكريم، التفسير، الأذكار، الأحاديث، ومواقيت الصلاة بتجربة هادئة.",
  manifest: "/manifest.webmanifest",
  applicationName: "رِفْق",
  appleWebApp: {
    capable: true,
    title: "رِفْق",
    statusBarStyle: "default"
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/favicon.ico"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#3f5638",
  colorScheme: "light"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="font-sans text-slate-950 dark:bg-slate-950 dark:text-slate-100">
        <ThemeProvider>
          <MobileStartupSplash />
          <AndroidBackButton />
          <NotificationManager />
          {children}
          <FirstRunOnboarding />
          <ServiceWorkerRegister />
        </ThemeProvider>
      </body>
    </html>
  );
}
