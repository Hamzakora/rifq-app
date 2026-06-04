import { STATIC_SURAH_LIST } from "@/lib/static/quranSurahList";

export type OfflineQuranAyah = {
  number: number;
  text: string;
  numberInSurah: number;
  juz?: number;
  manzil?: number;
  page: number;
  ruku?: number;
  hizbQuarter?: number;
  sajda?: boolean | { id: number; recommended: boolean; obligatory: boolean };
  surah?: {
    number: number;
    name: string;
    englishName?: string;
    englishNameTranslation?: string;
    revelationType?: string;
    numberOfAyahs?: number;
  };
};

export type OfflineQuranPagesData = {
  meta?: {
    sourceName?: string;
    sourceUrl?: string;
    generatedAt?: string;
    pages?: number;
    totalAyahs?: number;
  };
  pages: Record<string, { page: number; ayahs: OfflineQuranAyah[] }>;
};

const OFFLINE_QURAN_PAGES_PATHS = [
  "/offline-data/quran-pages.json",
  "offline-data/quran-pages.json",
  "./offline-data/quran-pages.json",
  "file:///android_asset/public/offline-data/quran-pages.json"
];

let quranPagesPromise: Promise<OfflineQuranPagesData | null> | null = null;

async function fetchJsonWithTimeout(url: string, timeoutMs = 9000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { cache: "force-cache", signal: controller.signal });
    if (!res.ok) throw new Error(`تعذر تحميل ${url}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function loadOfflineQuranPagesFile(): Promise<OfflineQuranPagesData | null> {
  if (typeof window === "undefined") return null;

  for (const path of OFFLINE_QURAN_PAGES_PATHS) {
    try {
      const json = await fetchJsonWithTimeout(path);
      if (json?.pages && typeof json.pages === "object") return json as OfflineQuranPagesData;
    } catch {
    }
  }

  return null;
}

export async function getOfflineQuranPagesData() {
  if (!quranPagesPromise) quranPagesPromise = loadOfflineQuranPagesFile();
  return quranPagesPromise;
}

export function offlineQuranTextMissingMessage() {
  return "تعذر فتح نص الصفحة دون اتصال.";
}

function meta(data: OfflineQuranPagesData | null) {
  return {
    sourceName: data?.meta?.sourceName || "نص المصحف المحلي",
    sourceUrl: data?.meta?.sourceUrl || "local://public/offline-data/quran-pages.json",
    fetchedAt: data?.meta?.generatedAt
  };
}

export async function getOfflineQuranPagePayload(page: number) {
  const data = await getOfflineQuranPagesData();
  const pageData = data?.pages?.[String(page)];
  if (!data || !pageData?.ayahs?.length) return null;

  return {
    data: { ayahs: pageData.ayahs, page },
    meta: meta(data)
  };
}

export async function getOfflineSurahPayload(sura: number) {
  const data = await getOfflineQuranPagesData();
  if (!data?.pages) return null;

  const summary = STATIC_SURAH_LIST.find((item) => item.number === sura);
  const ayahs = Object.values(data.pages)
    .flatMap((page) => page.ayahs || [])
    .filter((ayah) => ayah.surah?.number === sura || ayah.surah?.number === Number(sura))
    .sort((a, b) => a.numberInSurah - b.numberInSurah);

  if (!ayahs.length) return null;

  return {
    data: {
      number: sura,
      name: summary?.name || ayahs[0]?.surah?.name || `سورة ${sura}`,
      englishName: summary?.englishName || ayahs[0]?.surah?.englishName || "",
      englishNameTranslation: summary?.englishNameTranslation || ayahs[0]?.surah?.englishNameTranslation || "",
      revelationType: summary?.revelationType || ayahs[0]?.surah?.revelationType || "",
      numberOfAyahs: summary?.numberOfAyahs || ayahs.length,
      ayahs,
      edition: { identifier: "quran-uthmani-local", name: "Quran Uthmani Local" }
    },
    meta: meta(data)
  };
}
