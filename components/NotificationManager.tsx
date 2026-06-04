"use client";

import { useEffect } from "react";
import {
  readNotificationSettings,
  RIFQ_NOTIFICATIONS_EVENT,
  scheduleNativeNotifications,
  startWebNotificationTimers
} from "@/lib/client/notificationsStore";

export function NotificationManager() {
  useEffect(() => {
    let stopWebTimers: (() => void) | null = null;
    let alive = true;

    async function sync() {
      if (!alive) return;
      stopWebTimers?.();
      const settings = readNotificationSettings();
      stopWebTimers = startWebNotificationTimers(settings);
      await scheduleNativeNotifications(settings);
    }

    const handler = () => {
      void sync();
    };

    handler();
    window.addEventListener(RIFQ_NOTIFICATIONS_EVENT, handler);
    window.addEventListener("qawra-settings-change", handler);

    return () => {
      alive = false;
      stopWebTimers?.();
      window.removeEventListener(RIFQ_NOTIFICATIONS_EVENT, handler);
      window.removeEventListener("qawra-settings-change", handler);
    };
  }, []);

  return null;
}
