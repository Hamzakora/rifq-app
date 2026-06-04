import { readSettings } from "@/components/settingsStore";
import { calculatePrayerTimesForLocation } from "@/lib/prayer/localPrayerTimes";
import { getPrayerLocation } from "@/lib/prayer/prayerLocations";

export type RifqNotificationSettings = {
  enabled: boolean;
  morningAzkar: boolean;
  morningTime: string;
  eveningAzkar: boolean;
  eveningTime: string;
  khatma: boolean;
  khatmaTime: string;
  prayer: boolean;
  prayerOffsetMinutes: number;
};

export type RifqNotificationState = "unsupported" | "default" | "granted" | "denied";

type ReminderItem = {
  id: number;
  title: string;
  body: string;
  at: Date;
  daily?: boolean;
};

const KEY = "rifq-notifications-v1";
export const RIFQ_NOTIFICATIONS_EVENT = "rifq-notifications-change";

export const DEFAULT_NOTIFICATION_TIMES = {
  morningTime: "06:00",
  eveningTime: "18:00",
  khatmaTime: "21:00"
};

export const DEFAULT_NOTIFICATION_SETTINGS: RifqNotificationSettings = {
  enabled: false,
  morningAzkar: true,
  morningTime: DEFAULT_NOTIFICATION_TIMES.morningTime,
  eveningAzkar: true,
  eveningTime: DEFAULT_NOTIFICATION_TIMES.eveningTime,
  khatma: true,
  khatmaTime: DEFAULT_NOTIFICATION_TIMES.khatmaTime,
  prayer: false,
  prayerOffsetMinutes: 0
};

const NOTIFICATION_IDS = [8101, 8102, 8103, 8111, 8112, 8113, 8114, 8115];

function sanitizeTime(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  return /^\d{2}:\d{2}$/.test(value) ? value : fallback;
}

function sanitizeOffset(value: unknown) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(30, Math.round(num)));
}

export function readNotificationSettings(): RifqNotificationSettings {
  if (typeof window === "undefined") return DEFAULT_NOTIFICATION_SETTINGS;

  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "{}");
    return {
      enabled: Boolean(saved.enabled ?? DEFAULT_NOTIFICATION_SETTINGS.enabled),
      morningAzkar: Boolean(saved.morningAzkar ?? DEFAULT_NOTIFICATION_SETTINGS.morningAzkar),
      morningTime: sanitizeTime(saved.morningTime, DEFAULT_NOTIFICATION_SETTINGS.morningTime),
      eveningAzkar: Boolean(saved.eveningAzkar ?? DEFAULT_NOTIFICATION_SETTINGS.eveningAzkar),
      eveningTime: sanitizeTime(saved.eveningTime, DEFAULT_NOTIFICATION_SETTINGS.eveningTime),
      khatma: Boolean(saved.khatma ?? DEFAULT_NOTIFICATION_SETTINGS.khatma),
      khatmaTime: sanitizeTime(saved.khatmaTime, DEFAULT_NOTIFICATION_SETTINGS.khatmaTime),
      prayer: Boolean(saved.prayer ?? DEFAULT_NOTIFICATION_SETTINGS.prayer),
      prayerOffsetMinutes: sanitizeOffset(saved.prayerOffsetMinutes ?? DEFAULT_NOTIFICATION_SETTINGS.prayerOffsetMinutes)
    };
  } catch {
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
}

export function writeNotificationSettings(settings: RifqNotificationSettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(settings));
  window.dispatchEvent(new Event(RIFQ_NOTIFICATIONS_EVENT));
}

function isNativeApp() {
  if (typeof window === "undefined") return false;
  const capacitor = (window as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return Boolean(capacitor?.isNativePlatform?.());
}

async function getLocalNotifications(): Promise<any | null> {
  if (!isNativeApp()) return null;

  try {
    const mod = await import("@capacitor/local-notifications");
    return mod.LocalNotifications;
  } catch {
    return null;
  }
}

export async function getNotificationState(): Promise<RifqNotificationState> {
  if (typeof window === "undefined") return "unsupported";

  const LocalNotifications = await getLocalNotifications();
  if (LocalNotifications) {
    try {
      const permissions = await LocalNotifications.checkPermissions();
      return permissions.display === "granted" ? "granted" : permissions.display === "denied" ? "denied" : "default";
    } catch {
      return "default";
    }
  }

  if (!("Notification" in window)) return "unsupported";
  return Notification.permission as RifqNotificationState;
}

export async function requestNotificationPermission(): Promise<RifqNotificationState> {
  if (typeof window === "undefined") return "unsupported";

  const LocalNotifications = await getLocalNotifications();
  if (LocalNotifications) {
    try {
      const permissions = await LocalNotifications.requestPermissions();
      return permissions.display === "granted" ? "granted" : permissions.display === "denied" ? "denied" : "default";
    } catch {
      return "default";
    }
  }

  if (!("Notification" in window)) return "unsupported";
  const permission = await Notification.requestPermission();
  return permission as RifqNotificationState;
}

function dateFromTime(time: string, offsetMinutes = 0, base = new Date()) {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date(base);
  date.setHours(hours || 0, minutes || 0, 0, 0);
  date.setMinutes(date.getMinutes() - offsetMinutes);
  if (date.getTime() <= Date.now() + 1500) date.setDate(date.getDate() + 1);
  return date;
}

function parseTimeToDate(time: string, offsetMinutes = 0) {
  return dateFromTime(time, offsetMinutes);
}

function prayerReminderItems(settings: RifqNotificationSettings): ReminderItem[] {
  if (!settings.enabled || !settings.prayer) return [];

  try {
    const appSettings = readSettings();
    const location = getPrayerLocation(appSettings.prayerCountry, appSettings.prayerCity);
    if (!location) return [];

    const result = calculatePrayerTimesForLocation(location);
    const prayerNames: Record<string, string> = {
      Fajr: "الفجر",
      Dhuhr: "الظهر",
      Asr: "العصر",
      Maghrib: "المغرب",
      Isha: "العشاء"
    };

    return Object.entries(prayerNames).map(([key, label], index) => ({
      id: 8111 + index,
      title: `صلاة ${label}`,
      body: "حان وقت الصلاة.",
      at: parseTimeToDate(result.data.timings[key as keyof typeof result.data.timings], settings.prayerOffsetMinutes)
    }));
  } catch {
    return [];
  }
}

function buildReminderItems(settings: RifqNotificationSettings): ReminderItem[] {
  if (!settings.enabled) return [];

  const items: ReminderItem[] = [];

  if (settings.morningAzkar) {
    items.push({
      id: 8101,
      title: "أذكار الصباح",
      body: "ابدأ يومك بذكر الله.",
      at: parseTimeToDate(settings.morningTime),
      daily: true
    });
  }

  if (settings.eveningAzkar) {
    items.push({
      id: 8102,
      title: "أذكار المساء",
      body: "وقت أذكار المساء.",
      at: parseTimeToDate(settings.eveningTime),
      daily: true
    });
  }

  if (settings.khatma) {
    items.push({
      id: 8103,
      title: "ورد القرآن",
      body: "لا تنسَ وردك اليوم.",
      at: parseTimeToDate(settings.khatmaTime),
      daily: true
    });
  }

  return [...items, ...prayerReminderItems(settings)];
}

export async function cancelNativeNotifications() {
  const LocalNotifications = await getLocalNotifications();
  if (!LocalNotifications) return;

  try {
    await LocalNotifications.cancel({ notifications: NOTIFICATION_IDS.map((id) => ({ id })) });
  } catch {
    return;
  }
}

export async function scheduleNativeNotifications(settings = readNotificationSettings()) {
  const LocalNotifications = await getLocalNotifications();
  if (!LocalNotifications) return false;

  const state = await getNotificationState();
  if (state !== "granted") return false;

  await cancelNativeNotifications();
  const items = buildReminderItems(settings);
  if (!items.length) return true;

  await LocalNotifications.schedule({
    notifications: items.map((item) => ({
      id: item.id,
      title: item.title,
      body: item.body,
      schedule: item.daily
        ? { at: item.at, repeats: true, every: "day" }
        : { at: item.at },
    }))
  });

  return true;
}

function showWebNotification(title: string, body: string) {
  if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") return;

  try {
    new Notification(title, { body, icon: "/icon-192.png", badge: "/icon-192.png" });
  } catch {
    return;
  }
}

export function startWebNotificationTimers(settings = readNotificationSettings()) {
  if (typeof window === "undefined" || isNativeApp() || !("Notification" in window) || Notification.permission !== "granted") {
    return () => undefined;
  }

  const timers: number[] = [];

  function scheduleItem(item: ReminderItem) {
    const delay = Math.max(1000, item.at.getTime() - Date.now());
    const timer = window.setTimeout(() => {
      showWebNotification(item.title, item.body);
      if (item.daily) {
        const next = { ...item, at: new Date(item.at.getTime() + 86400000) };
        scheduleItem(next);
      }
    }, delay);
    timers.push(timer);
  }

  buildReminderItems(settings).forEach(scheduleItem);
  return () => timers.forEach((timer) => window.clearTimeout(timer));
}

export function notificationStateLabel(state: RifqNotificationState) {
  if (state === "granted") return "مفعلة";
  if (state === "denied") return "غير مفعلة";
  if (state === "unsupported") return "غير متاحة";
  return "تحتاج تفعيل";
}
