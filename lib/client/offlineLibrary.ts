import {
  cacheBinaryResponse,
  cacheJsonResponse,
  quranAudioUrl,
  HADITH_CACHE,
  QURAN_AUDIO_CACHE,
  QURAN_MUSHAF_IMAGE_CACHE,
  QURAN_TEXT_CACHE,
  RIFQ_CORE_CACHE,
  TAFSIR_CACHE
} from "@/lib/client/offlineCache";
import { cacheLocalHadithFile } from "@/lib/client/offlineHadith";
import { getQuranSurahAudioCandidates } from "@/lib/quran/reciters";

export { HADITH_CACHE, RIFQ_CORE_CACHE, TAFSIR_CACHE } from "@/lib/client/offlineCache";

export type OfflineJobKey = "quranText" | "mushafImages" | "azkar" | "reciter" | "tafsir" | "hadith" | "allCore" | "clear";

export type OfflineCacheStats = {
  supported: boolean;
  quranText: number;
  mushafImages: number;
  audio: number;
  core: number;
  tafsir: number;
  hadith: number;
  total: number;
};

const QURAN_PAGE_TOTAL = 604;
const QURAN_TEXT_TOTAL = 605;
export const TAFSIR_AYAH_TOTAL = 6236;

function supportsCaches() {
  return typeof window !== "undefined" && "caches" in window;
}

export function mushafPageImageUrl(page: number, remote = false) {
  const safePage = String(Math.max(1, Math.min(604, page))).padStart(3, "0");
  return remote
    ? `https://raw.githubusercontent.com/GovarJabbar/Quran-PNG/master/${safePage}.png`
    : `/mushaf-pages/${safePage}.png`;
}

async function cacheMushafPageImage(page: number) {
  try {
    await cacheBinaryResponse(mushafPageImageUrl(page), QURAN_MUSHAF_IMAGE_CACHE);
  } catch (error) {
    await cacheBinaryResponse(mushafPageImageUrl(page, true), QURAN_MUSHAF_IMAGE_CACHE);
  }
}


async function cacheStaticJsonFile(url: string, cacheName: string) {
  const response = await fetch(url, { cache: "reload" });
  if (!response.ok) throw new Error(`تعذر تحميل ${url}`);

  if (supportsCaches()) {
    const cache = await caches.open(cacheName);
    const cacheKey = new URL(url, window.location.origin).toString();
    await cache.put(cacheKey, response.clone());
  }

  return response.json();
}

async function countCacheEntries(cacheName: string) {
  if (!supportsCaches()) return 0;
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  return keys.length;
}

export async function getOfflineCacheStats(): Promise<OfflineCacheStats> {
  if (!supportsCaches()) {
    return { supported: false, quranText: 0, mushafImages: 0, audio: 0, core: 0, tafsir: 0, hadith: 0, total: 0 };
  }

  const [quranText, mushafImages, audio, core, tafsir, hadith] = await Promise.all([
    countCacheEntries(QURAN_TEXT_CACHE),
    countCacheEntries(QURAN_MUSHAF_IMAGE_CACHE),
    countCacheEntries(QURAN_AUDIO_CACHE),
    countCacheEntries(RIFQ_CORE_CACHE),
    countCacheEntries(TAFSIR_CACHE),
    countCacheEntries(HADITH_CACHE)
  ]);

  return {
    supported: true,
    quranText,
    mushafImages,
    audio,
    core,
    tafsir,
    hadith,
    total: quranText + mushafImages + audio + core + tafsir + hadith
  };
}


export async function cacheQuranTextLibrary(onProgress?: (done: number, total: number, message: string) => void) {
  try {
    onProgress?.(0, 1, "جاري حفظ ملف نص المصحف المحلي...");
    await cacheStaticJsonFile("/offline-data/quran-pages.json", QURAN_TEXT_CACHE);
    onProgress?.(1, 1, "تم حفظ نص المصحف المحلي.");
    return;
  } catch {
  }

  const total = QURAN_TEXT_TOTAL;
  let done = 0;
  onProgress?.(done, total, "جاري حفظ فهرس السور...");
  await cacheJsonResponse("/api/quran/chapters", QURAN_TEXT_CACHE);
  done += 1;

  for (let page = 1; page <= QURAN_PAGE_TOTAL; page += 1) {
    onProgress?.(done, total, `جاري حفظ نص صفحة ${page} من ${QURAN_PAGE_TOTAL}...`);
    await cacheJsonResponse(`/api/quran/page?page=${page}`, QURAN_TEXT_CACHE);
    done += 1;
  }

  onProgress?.(done, total, "تم حفظ نص المصحف وفهرس السور.");
}


export async function cacheMushafImages(onProgress?: (done: number, total: number, message: string) => void) {
  const total = QURAN_PAGE_TOTAL;
  let done = 0;

  for (let page = 1; page <= QURAN_PAGE_TOTAL; page += 1) {
    onProgress?.(done, total, `جاري حفظ صورة صفحة ${page} من ${QURAN_PAGE_TOTAL}...`);
    await cacheMushafPageImage(page);
    done += 1;
  }

  onProgress?.(done, total, "تم حفظ صور صفحات المصحف.");
}

export async function cacheTafsirLibrary(onProgress?: (done: number, total: number, message: string) => void) {
  try {
    onProgress?.(0, 1, "جاري حفظ ملف التفسير المحلي...");
    await cacheStaticJsonFile("/offline-data/tafsir-muyassar.json", TAFSIR_CACHE);
    onProgress?.(1, 1, "تم حفظ التفسير المحلي.");
    return;
  } catch {
  }

  onProgress?.(0, TAFSIR_AYAH_TOTAL + 1, "جاري تجهيز فهرس السور للتفسير...");
  const chaptersPayload = await cacheJsonResponse("/api/quran/chapters", QURAN_TEXT_CACHE);
  const chapters = Array.isArray(chaptersPayload?.data) ? chaptersPayload.data : [];
  const total = chapters.reduce((sum: number, chapter: any) => sum + Number(chapter?.numberOfAyahs || 0), 0) || TAFSIR_AYAH_TOTAL;
  let done = 0;

  for (const chapter of chapters) {
    const sura = Number(chapter?.number);
    const ayahCount = Number(chapter?.numberOfAyahs || 0);
    if (!Number.isFinite(sura) || sura < 1 || ayahCount < 1) continue;

    for (let aya = 1; aya <= ayahCount; aya += 1) {
      onProgress?.(done, total, `جاري حفظ تفسير ${chapter?.name || "السورة"} — آية ${aya}...`);
      await cacheJsonResponse(`/api/tafsir?sura=${sura}&aya=${aya}`, TAFSIR_CACHE);
      done += 1;
    }
  }

  onProgress?.(done, total, "تم حفظ التفسير على الجهاز.");
}


export async function cacheAzkarLibrary(onProgress?: (done: number, total: number, message: string) => void) {
  onProgress?.(0, 1, "جاري حفظ مكتبة الأذكار...");
  try {
    await cacheJsonResponse("/api/azkar", RIFQ_CORE_CACHE);
  } catch {
  }
  onProgress?.(1, 1, "تم حفظ مكتبة الأذكار.");
}


export async function cacheHadithLibrary(onProgress?: (done: number, total: number, message: string) => void) {
  await cacheLocalHadithFile(onProgress);
}


async function getReciterSurahUrl(edition: string, surahNumber: number) {
  const candidates = [...getQuranSurahAudioCandidates(edition, surahNumber), quranAudioUrl(edition, surahNumber)]
    .filter((item): item is string => typeof item === "string" && item.length > 0);
  const url = Array.from(new Set(candidates))[0];
  if (!url) throw new Error("تعذر تحميل الصوت.");
  return url;
}

export async function cacheReciterLibrary(edition: string, onProgress?: (done: number, total: number, message: string) => void) {
  const total = 114;

  for (let surahNumber = 1; surahNumber <= 114; surahNumber += 1) {
    onProgress?.(surahNumber - 1, total, `جاري تحميل السورة ${surahNumber} من 114...`);
    await cacheBinaryResponse(await getReciterSurahUrl(edition, surahNumber), QURAN_AUDIO_CACHE);
  }

  onProgress?.(total, total, "تم تحميل تلاوة القارئ.");
}

export async function cacheEssentialOfflineLibrary(onProgress?: (done: number, total: number, message: string) => void) {
  const jobs = [
    { weight: 604, label: "صور المصحف", run: cacheMushafImages },
    { weight: 605, label: "نص المصحف", run: cacheQuranTextLibrary },
    { weight: TAFSIR_AYAH_TOTAL, label: "التفسير", run: cacheTafsirLibrary },
    { weight: 1, label: "الأذكار", run: cacheAzkarLibrary },
    { weight: 1200, label: "الأحاديث", run: cacheHadithLibrary }
  ];

  const grandTotal = jobs.reduce((sum, job) => sum + job.weight, 0);
  let base = 0;

  for (const job of jobs) {
    await job.run((done, total, message) => {
      const normalized = total ? Math.round((done / total) * job.weight) : 0;
      onProgress?.(Math.min(base + normalized, grandTotal), grandTotal, `${job.label}: ${message}`);
    });
    base += job.weight;
  }

  onProgress?.(grandTotal, grandTotal, "تم تحميل المحتوى الأساسي.");
}

export async function clearOfflineLibraryCaches() {
  if (!supportsCaches()) return;
  await Promise.all([
    caches.delete(QURAN_TEXT_CACHE),
    caches.delete(QURAN_MUSHAF_IMAGE_CACHE),
    caches.delete(QURAN_AUDIO_CACHE),
    caches.delete(RIFQ_CORE_CACHE),
    caches.delete(TAFSIR_CACHE),
    caches.delete(HADITH_CACHE)
  ]);
}
