import { STATIC_SURAH_LIST } from "@/lib/static/quranSurahList";

export type OfflineTafsirAyah = {
  aya: number;
  ayahText?: string;
  tafsirText: string;
  footnotes?: string;
};

export type OfflineTafsirData = {
  meta?: {
    sourceName?: string;
    sourceUrl?: string;
    generatedAt?: string;
    totalAyahs?: number;
  };
  surahs: Record<
    string,
    {
      number: number;
      name: string;
      ayahs: Record<string, OfflineTafsirAyah>;
    }
  >;
};

type TafsirPayload = {
  data: { result: any[] };
  meta: {
    sourceName: string;
    sourceUrl: string;
    fetchedAt?: string;
  };
};

const OFFLINE_TAFSIR_PATHS = [
  "/offline-data/tafsir-muyassar.json",
  "offline-data/tafsir-muyassar.json",
  "./offline-data/tafsir-muyassar.json",
  "file:///android_asset/public/offline-data/tafsir-muyassar.json"
];

let tafsirPromise: Promise<OfflineTafsirData | null> | null = null;

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

async function loadOfflineTafsirFile(): Promise<OfflineTafsirData | null> {
  if (typeof window === "undefined") return null;

  for (const path of OFFLINE_TAFSIR_PATHS) {
    try {
      const json = await fetchJsonWithTimeout(path);
      if (json?.surahs && typeof json.surahs === "object") return json as OfflineTafsirData;
    } catch {
    }
  }

  return null;
}

export async function getOfflineTafsirData() {
  if (!tafsirPromise) tafsirPromise = loadOfflineTafsirFile();
  return tafsirPromise;
}

function sourceMeta(data: OfflineTafsirData | null) {
  return {
    sourceName: data?.meta?.sourceName || "التفسير الميسر المحلي",
    sourceUrl: data?.meta?.sourceUrl || "local://public/offline-data/tafsir-muyassar.json",
    fetchedAt: data?.meta?.generatedAt
  };
}

export function offlineTafsirMissingMessage() {
  return "تعذر فتح التفسير دون اتصال.";
}

export async function getOfflineTafsirAyahPayload(sura: number, aya: number): Promise<TafsirPayload | null> {
  const data = await getOfflineTafsirData();
  const item = data?.surahs?.[String(sura)]?.ayahs?.[String(aya)];
  if (!data || !item?.tafsirText) return null;

  return {
    data: {
      result: [
        {
          sura,
          aya,
          arabic_text: item.ayahText || "",
          aya_text: item.ayahText || "",
          translation: item.tafsirText,
          text: item.tafsirText,
          tafsir: item.tafsirText,
          footnotes: item.footnotes || ""
        }
      ]
    },
    meta: sourceMeta(data)
  };
}

export async function getOfflineTafsirSurahPayload(sura: number): Promise<TafsirPayload | null> {
  const data = await getOfflineTafsirData();
  const surah = data?.surahs?.[String(sura)];
  if (!data || !surah?.ayahs) return null;

  const summary = STATIC_SURAH_LIST.find((item) => item.number === sura);
  const ayahCount = summary?.numberOfAyahs || Object.keys(surah.ayahs).length;

  const result = Array.from({ length: ayahCount }, (_, index) => {
    const aya = index + 1;
    const item = surah.ayahs[String(aya)];
    if (!item?.tafsirText) return null;

    return {
      sura,
      aya,
      arabic_text: item.ayahText || "",
      aya_text: item.ayahText || "",
      translation: item.tafsirText,
      text: item.tafsirText,
      tafsir: item.tafsirText,
      footnotes: item.footnotes || ""
    };
  }).filter(Boolean) as any[];

  if (!result.length) return null;

  return {
    data: { result },
    meta: sourceMeta(data)
  };
}
