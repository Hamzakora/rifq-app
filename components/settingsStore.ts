export type QawraSettings = {
  quranFontSize: number;
  quranDefaultMode: "index" | "surah" | "page" | "juz" | "hizb";
  reciter: string;
  defaultKhatmaDays: number;
  prayerCountry: string;
  prayerCity: string;
  cardTheme: "emerald" | "night" | "gold";
};

export const DEFAULT_SETTINGS: QawraSettings = {
  quranFontSize: 34,
  quranDefaultMode: "index",
  reciter: "ar.alafasy",
  defaultKhatmaDays: 30,
  prayerCountry: "Egypt",
  prayerCity: "Cairo",
  cardTheme: "emerald"
};

const KEY = "qawra-settings-v1";

export function readSettings(): QawraSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;

  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "{}");
    return { ...DEFAULT_SETTINGS, ...saved };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function writeSettings(settings: QawraSettings) {
  localStorage.setItem(KEY, JSON.stringify(settings));
  window.dispatchEvent(new Event("qawra-settings-change"));
}

export type QawraProfile = {
  name: string;
  email?: string;
  createdAt: string;
};

const PROFILE_KEY = "qawra-profile-v1";

export function readProfile(): QawraProfile | null {
  if (typeof window === "undefined") return null;

  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY) || "null");
  } catch {
    return null;
  }
}

export function writeProfile(profile: QawraProfile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  window.dispatchEvent(new Event("qawra-profile-change"));
}

export function clearProfile() {
  localStorage.removeItem(PROFILE_KEY);
  window.dispatchEvent(new Event("qawra-profile-change"));
}
