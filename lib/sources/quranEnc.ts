import { buildSourceMeta } from "@/lib/security/immutableReligiousText";
import { STATIC_SURAH_LIST } from "@/lib/static/quranSurahList";

const BASE_URL = process.env.QURANENC_BASE_URL || "https://quranenc.com/api/v1";
const DEFAULT_KEY = process.env.QURANENC_TAFSIR_KEY || "arabic_moyassar";

async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function getArabicMuyassarTafsir(sura: number, aya: number) {
  if (!Number.isInteger(sura) || sura < 1 || sura > 114) {
    throw new Error("Invalid sura number.");
  }

  if (!Number.isInteger(aya) || aya < 1) {
    throw new Error("Invalid aya number.");
  }

  const key = encodeURIComponent(DEFAULT_KEY);
  const url = `/translation/aya/${key}/${sura}/${aya}`;

  const res = await fetchWithTimeout(`${BASE_URL}${url}`, {
    headers: { accept: "application/json" },
    next: { revalidate: 60 * 60 * 24 * 7 }
  });

  if (!res.ok) {
    throw new Error(`QuranEnc request failed: ${res.status}`);
  }

  const data = await res.json();

  return {
    data,
    meta: buildSourceMeta(`QuranEnc — ${DEFAULT_KEY}`, `${BASE_URL}${url}`)
  };
}


export async function getArabicMuyassarSurahTafsir(sura: number) {
  if (!Number.isInteger(sura) || sura < 1 || sura > 114) {
    throw new Error("Invalid sura number.");
  }

  const key = encodeURIComponent(DEFAULT_KEY);
  const url = `/translation/sura/${key}/${sura}`;

  const res = await fetchWithTimeout(`${BASE_URL}${url}`, {
    headers: { accept: "application/json" },
    next: { revalidate: 60 * 60 * 24 * 7 }
  });

  if (!res.ok) {
    // Fallback: some QuranEnc mirrors may not expose the sura endpoint reliably.
    // In that case, collect the surah ayah-by-ayah on the server and return one payload.
    const summary = STATIC_SURAH_LIST.find((item) => item.number === sura);
    if (!summary) throw new Error(`QuranEnc request failed: ${res.status}`);

    const ayahs = [];
    for (let aya = 1; aya <= summary.numberOfAyahs; aya += 1) {
      const single = await getArabicMuyassarTafsir(sura, aya);
      const raw = single?.data?.result ?? single?.data;
      const result = Array.isArray(raw) ? raw[0] : raw;
      ayahs.push({ aya, ...result });
    }

    return {
      data: { result: ayahs },
      meta: buildSourceMeta(`QuranEnc — ${DEFAULT_KEY}`, `${BASE_URL}/translation/aya/${key}/${sura}/[1-${summary.numberOfAyahs}]`)
    };
  }

  const data = await res.json();

  return {
    data,
    meta: buildSourceMeta(`QuranEnc — ${DEFAULT_KEY}`, `${BASE_URL}${url}`)
  };
}
