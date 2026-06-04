"use client";

import { useEffect } from "react";

function isNativeCapacitor() {
  if (typeof window === "undefined") return false;
  const capacitor = (window as any).Capacitor;
  return Boolean(capacitor?.isNativePlatform?.());
}

function fallbackRouteFor(pathname: string, search = "") {
  if (pathname.startsWith("/hadith/detail")) {
    const params = new URLSearchParams(search);
    const categoryId = params.get("categoryId");
    const page = params.get("page") || "1";
    return categoryId ? `/hadith?categoryId=${categoryId}&page=${page}` : "/hadith";
  }
  if (pathname.startsWith("/quran")) return "/quran";
  if (pathname !== "/") return "/";
  return null;
}

export function AndroidBackButton() {
  useEffect(() => {
    if (!isNativeCapacitor()) return;

    let isMounted = true;
    let removeListener: (() => Promise<void>) | null = null;

    async function setupBackButton() {
      try {
        const { App } = await import("@capacitor/app");
        if (!isMounted) return;

        const listener = await App.addListener("backButton", () => {
          const fallback = fallbackRouteFor(window.location.pathname, window.location.search);

          if (window.history.length > 1) {
            window.history.back();
            return;
          }

          if (fallback) {
            window.location.href = fallback;
          }
        });

        removeListener = () => listener.remove();
      } catch {
      }
    }

    setupBackButton();

    return () => {
      isMounted = false;
      if (removeListener) void removeListener();
    };
  }, []);

  return null;
}
