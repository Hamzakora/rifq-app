export type ActivityKind = "read" | "listen" | "favorite" | "khatma" | "azkar" | "general";

export type DailyActivity = {
  readPages: number[];
  readAyahs: string[];
  listeningSeconds: number;
  actions: number;
};

export type ActivityStore = {
  version: 1;
  readPages: number[];
  readAyahs: string[];
  listeningSeconds: number;
  listenSessions: number;
  daily: Record<string, DailyActivity>;
  lastAction?: {
    type: ActivityKind;
    label: string;
    at: string;
  };
};

export const ACTIVITY_KEY = "rifq-activity-v1";
export const ACTIVITY_EVENT = "rifq-activity-change";

function emptyDaily(): DailyActivity {
  return { readPages: [], readAyahs: [], listeningSeconds: 0, actions: 0 };
}

function createEmptyStore(): ActivityStore {
  return {
    version: 1,
    readPages: [],
    readAyahs: [],
    listeningSeconds: 0,
    listenSessions: 0,
    daily: {}
  };
}

export function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function sanitizeStore(value: Partial<ActivityStore> | null): ActivityStore {
  const base = createEmptyStore();
  if (!value || typeof value !== "object") return base;

  return {
    version: 1,
    readPages: Array.isArray(value.readPages)
      ? Array.from(new Set(value.readPages.map(Number).filter((page) => Number.isInteger(page) && page >= 1 && page <= 604))).sort((a, b) => a - b)
      : [],
    readAyahs: Array.isArray(value.readAyahs)
      ? Array.from(new Set(value.readAyahs.filter((item): item is string => typeof item === "string" && item.length > 0)))
      : [],
    listeningSeconds: Math.max(0, Number(value.listeningSeconds || 0)),
    listenSessions: Math.max(0, Number(value.listenSessions || 0)),
    daily: value.daily && typeof value.daily === "object" ? value.daily : {},
    lastAction: value.lastAction
  };
}

export function readActivity(): ActivityStore {
  if (typeof window === "undefined") return createEmptyStore();

  try {
    return sanitizeStore(JSON.parse(localStorage.getItem(ACTIVITY_KEY) || "null"));
  } catch {
    return createEmptyStore();
  }
}

function writeActivity(store: ActivityStore) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(store));
  window.dispatchEvent(new Event(ACTIVITY_EVENT));
}

function updateToday(store: ActivityStore) {
  const key = localDateKey();
  const current = store.daily[key] || emptyDaily();
  store.daily[key] = {
    readPages: Array.isArray(current.readPages) ? current.readPages : [],
    readAyahs: Array.isArray(current.readAyahs) ? current.readAyahs : [],
    listeningSeconds: Math.max(0, Number(current.listeningSeconds || 0)),
    actions: Math.max(0, Number(current.actions || 0))
  };
  return store.daily[key];
}

export function recordActivityAction(type: ActivityKind, label: string) {
  const store = readActivity();
  const today = updateToday(store);
  today.actions += 1;
  store.lastAction = { type, label, at: new Date().toISOString() };
  writeActivity(store);
}

export function recordReadingPage(page: number, label?: string) {
  if (!Number.isInteger(page) || page < 1 || page > 604) return;

  const store = readActivity();
  const today = updateToday(store);

  if (!store.readPages.includes(page)) {
    store.readPages = [...store.readPages, page].sort((a, b) => a - b);
  }

  if (!today.readPages.includes(page)) {
    today.readPages = [...today.readPages, page].sort((a, b) => a - b);
  }

  today.actions += 1;
  store.lastAction = { type: "read", label: label || `قرأت صفحة ${page}`, at: new Date().toISOString() };
  writeActivity(store);
}

export function recordReadingAyah(id: string, label?: string) {
  if (!id) return;

  const store = readActivity();
  const today = updateToday(store);

  if (!store.readAyahs.includes(id)) store.readAyahs = [id, ...store.readAyahs];
  if (!today.readAyahs.includes(id)) today.readAyahs = [id, ...today.readAyahs];

  today.actions += 1;
  store.lastAction = { type: "read", label: label || "قرأت آية من القرآن", at: new Date().toISOString() };
  writeActivity(store);
}

export function recordListenStart(label?: string) {
  const store = readActivity();
  const today = updateToday(store);
  today.actions += 1;
  store.listenSessions += 1;
  store.lastAction = { type: "listen", label: label || "بدأت الاستماع للقرآن", at: new Date().toISOString() };
  writeActivity(store);
}

export function recordListenSeconds(seconds: number, label?: string) {
  const safeSeconds = Math.max(0, Math.round(seconds));
  if (!safeSeconds) return;

  const store = readActivity();
  const today = updateToday(store);
  store.listeningSeconds += safeSeconds;
  today.listeningSeconds += safeSeconds;
  store.lastAction = { type: "listen", label: label || "استمعت للقرآن", at: new Date().toISOString() };
  writeActivity(store);
}
