"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const STARTUP_SPLASH_KEY = "rifq-mobile-startup-splash-seen-v1";

export function MobileStartupSplash() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const isMobile = window.matchMedia("(max-width: 767px)").matches;

    if (!isMobile) {
      setVisible(false);
      return;
    }

    try {
      if (sessionStorage.getItem(STARTUP_SPLASH_KEY) === "done") {
        setVisible(false);
        return;
      }
    } catch {
      // Keep the splash if sessionStorage is unavailable.
    }

    const timer = window.setTimeout(() => {
      try {
        sessionStorage.setItem(STARTUP_SPLASH_KEY, "done");
      } catch {
        // ignore storage errors
      }
      setVisible(false);
    }, 1650);

    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="rifq-startup-splash" aria-label="جاري فتح تطبيق رِفْق" role="status">
      <div className="rifq-startup-splash-glow" />
      <div className="rifq-startup-logo-card">
        <Image
          src="/rifq-logo.png"
          alt="شعار رِفْق"
          width={220}
          height={220}
          priority
          className="rifq-startup-logo"
        />
      </div>
      <p>رِفْق</p>
      <span>رفيقك اليومي في القرآن والذكر</span>
    </div>
  );
}
