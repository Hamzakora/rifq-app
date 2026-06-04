import { buildSourceMeta } from "@/lib/security/immutableReligiousText";
import { STATIC_SURAH_LIST } from "@/lib/static/quranSurahList";
import { LONG_CACHE_SECONDS } from "@/lib/http/cache";

const BASE_URL = process.env.ALQURAN_CLOUD_BASE_URL || "https://api.alquran.cloud/v1";

async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchAlQuranCloud<T>(path: string): Promise<T> {
  const res = await fetchWithTimeout(`${BASE_URL}${path}`, {
    headers: { accept: "application/json" },
    cache: "force-cache",
    next: { revalidate: LONG_CACHE_SECONDS }
  });

  if (!res.ok) {
    throw new Error(`AlQuran.cloud request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export type SurahSummary = {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
};

export type Ayah = {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  manzil: number;
  page: number;
  ruku: number;
  hizbQuarter: number;
  sajda: boolean | { id: number; recommended: boolean; obligatory: boolean };
};

export async function getSurahList() {
  if (process.env.QURAN_STATIC_SURAH_LIST !== "false") {
    return {
      data: STATIC_SURAH_LIST,
      meta: buildSourceMeta("Static Surah List — approved app source", "local://lib/static/quranSurahList.ts")
    };
  }

  const url = "/surah";
  const raw = await fetchAlQuranCloud<{ code: number; status: string; data: SurahSummary[] }>(url);

  return {
    data: raw.data,
    meta: buildSourceMeta("AlQuran.cloud", `${BASE_URL}${url}`)
  };
}

export async function getSurah(number: number, edition = "quran-uthmani") {
  if (!Number.isInteger(number) || number < 1 || number > 114) {
    throw new Error("Invalid surah number.");
  }

  const safeEdition = encodeURIComponent(edition || "quran-uthmani");
  const url = `/surah/${number}/${safeEdition}`;

  const raw = await fetchAlQuranCloud<{
    code: number;
    status: string;
    data: {
      number: number;
      name: string;
      englishName: string;
      englishNameTranslation: string;
      revelationType: string;
      numberOfAyahs: number;
      ayahs: Ayah[];
      edition: unknown;
    };
  }>(url);

  return {
    data: raw.data,
    meta: buildSourceMeta("AlQuran.cloud — Quran Uthmani edition", `${BASE_URL}${url}`)
  };
}
