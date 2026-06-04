import { getQuranSurahAudioCandidates } from "@/lib/quran/reciters";
export const QURAN_TEXT_CACHE = "rifq-quran-text-v1";
export const QURAN_AUDIO_CACHE = "rifq-quran-audio-v1";
export const QURAN_MUSHAF_IMAGE_CACHE = "rifq-mushaf-images-v1";
export const RIFQ_CORE_CACHE = "rifq-core-data-v1";
export const TAFSIR_CACHE = "rifq-tafsir-v1";
export const HADITH_CACHE = "rifq-hadith-v1";


async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function normalizeRequestUrl(url: string) {
  if (typeof window === "undefined") return url;
  return new URL(url, window.location.origin).toString();
}

export async function cacheJsonResponse(url: string, cacheName = QURAN_TEXT_CACHE) {
  const res = await fetchWithTimeout(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`تعذر تحميل ${url}`);
  const cache = await caches.open(cacheName);
  await cache.put(normalizeRequestUrl(url), res.clone());
  return res.json();
}

export async function cachedJsonFetch(url: string, cacheName = QURAN_TEXT_CACHE) {
  if (typeof window === "undefined" || !("caches" in window)) {
    const res = await fetchWithTimeout(url);
    if (!res.ok) throw new Error(`تعذر تحميل ${url}`);
    return res.json();
  }

  const cache = await caches.open(cacheName);
  const cacheKey = normalizeRequestUrl(url);

  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) throw new Error(`تعذر تحميل ${url}`);
    await cache.put(cacheKey, res.clone());
    return res.json();
  } catch (error) {
    const cached = await cache.match(cacheKey) || await cache.match(url);
    if (!cached) throw error;
    return cached.json();
  }
}

export async function cacheBinaryResponse(url: string, cacheName: string) {
  if (typeof window === "undefined" || !("caches" in window)) {
    const res = await fetch(url);
    if (!res.ok && res.type !== "opaque") throw new Error(`تعذر تحميل ${url}`);
    return res;
  }

  const cache = await caches.open(cacheName);
  const cached = await cache.match(url);
  if (cached) return cached;

  let res: Response;
  try {
    res = await fetch(url, { cache: "reload" });
  } catch (error) {
    if (!url.endsWith(".mp3")) throw error;
    res = await fetch(url, { cache: "reload", mode: "no-cors" });
  }

  if (!res.ok && res.type !== "opaque") throw new Error(`تعذر تحميل ${url}`);
  await cache.put(url, res.clone());
  return res;
}

export async function isUrlCached(url: string, cacheName: string) {
  if (typeof window === "undefined" || !("caches" in window)) return false;
  const cache = await caches.open(cacheName);
  return Boolean(await cache.match(url));
}

export function quranAudioUrl(edition: string, chapter: number) {
  return getQuranSurahAudioCandidates(edition, chapter)[0];
}
