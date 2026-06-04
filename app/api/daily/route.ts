import { NextRequest, NextResponse } from "next/server";
import { getSurah } from "@/lib/sources/alQuranCloud";
import { getAzkarFromApprovedJson } from "@/lib/sources/azkarSource";
import { getArabicMuyassarTafsir } from "@/lib/sources/quranEnc";
import { getHadeethsByCategory } from "@/lib/sources/hadeethEnc";
import { auditLog } from "@/lib/security/auditLog";
import { cacheHeaders } from "@/lib/http/cache";

export const revalidate = 86400;

type DailyPrefs = {
  ayahs: number;
  tafsirs: number;
  hadiths: number;
  azkar: number;
};

function clampCount(value: string | null, fallback: number) {
  const n = Number(value || fallback);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(5, Math.floor(n)));
}

function dayIndex(max: number) {
  const d = new Date();
  const key = Number(`${d.getUTCFullYear()}${d.getUTCMonth() + 1}${d.getUTCDate()}`);
  return (key % Math.max(1, max)) + 1;
}

function takeWrapped<T>(list: T[], start: number, count: number): T[] {
  if (!Array.isArray(list) || !list.length || count <= 0) return [];
  const result: T[] = [];
  for (let i = 0; i < count; i += 1) result.push(list[(start + i) % list.length]);
  return result;
}

function cleanText(value: unknown): string {
  if (Array.isArray(value)) return value.filter(Boolean).map(String).join("\n");
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function normalizeItem(item: any) {
  if (typeof item === "string") return { text: item };
  return {
    text: cleanText(item?.zekr || item?.text || item?.content || item?.arabic || item?.body || item),
    repeat: item?.repeat || item?.count || item?.times,
    footnote: item?.footnote || item?.description
  };
}

function normalizeAzkarCategories(data: any): { title: string; items: any[] }[] {
  if (!data || typeof data !== "object") return [];

  return Object.entries(data)
    .map(([title, value]) => {
      if (Array.isArray(value)) return { title, items: value.map(normalizeItem).filter((item) => item.text) };
      if (value && typeof value === "object") {
        const texts = (value as any).text || (value as any).azkar || (value as any).items || (value as any).content || (value as any).data;
        if (Array.isArray(texts)) return { title, items: texts.map(normalizeItem).filter((item) => item.text) };
      }
      return null;
    })
    .filter(Boolean) as { title: string; items: any[] }[];
}

export async function GET(request: NextRequest) {
  try {
    const prefs: DailyPrefs = {
      ayahs: clampCount(request.nextUrl.searchParams.get("ayahs"), 2),
      tafsirs: clampCount(request.nextUrl.searchParams.get("tafsirs"), 1),
      hadiths: clampCount(request.nextUrl.searchParams.get("hadiths"), 1),
      azkar: clampCount(request.nextUrl.searchParams.get("azkar"), 2)
    };

    const chapter = dayIndex(114);

    await auditLog({ action: "read", target: "daily", metadata: { chapter, prefs } });

    const [quranResult, azkarResult, hadithResult] = await Promise.all([
      getSurah(chapter),
      getAzkarFromApprovedJson(),
      getHadeethsByCategory({ categoryId: 1, page: 1, perPage: Math.max(1, prefs.hadiths), language: "ar" })
    ]);

    const allAyahs = quranResult.data.ayahs || [];
    const startAyahIndex = (dayIndex(Math.max(1, allAyahs.length)) - 1) % Math.max(1, allAyahs.length || 1);
    const ayahs = takeWrapped(allAyahs, startAyahIndex, prefs.ayahs);

    const tafsirTargets = ayahs.slice(0, prefs.tafsirs);
    const tafsirs = await Promise.all(
      tafsirTargets.map(async (ayah: any) => {
        const ayahNumber = Number(ayah.numberInSurah || 1);
        try {
          const tafsir = await getArabicMuyassarTafsir(chapter, ayahNumber);
          const text =
            (tafsir as any)?.data?.result?.translation ||
            (tafsir as any)?.data?.result?.[0]?.translation ||
            "";
          return { ayahNumber, text };
        } catch {
          return { ayahNumber, text: "تعذر تحميل التفسير لهذه الآية." };
        }
      })
    );

    const azkarCategories = normalizeAzkarCategories(azkarResult.data);
    const morning = azkarCategories.find((cat) => cat.title.includes("الصباح"));
    const evening = azkarCategories.find((cat) => cat.title.includes("المساء"));
    const category =
      new Date().getHours() < 17
        ? morning || azkarCategories[0]
        : evening || morning || azkarCategories[0];

    const azkarStart = dayIndex(Math.max(1, category?.items?.length || 1)) - 1;
    const azkar = takeWrapped(category?.items || [], azkarStart, prefs.azkar);

    const hadithRows = Array.isArray((hadithResult as any)?.data?.data) ? (hadithResult as any).data.data : [];

    return NextResponse.json(
      {
        data: {
          chapter,
          ayahs,
          tafsirs: tafsirs.filter((row) => row.text),
          hadiths: hadithRows.slice(0, prefs.hadiths),
          azkarCategory: category?.title || "الأذكار",
          azkar,
          prefs
        },
        meta: {
          quran: quranResult.meta,
          azkar: azkarResult.meta,
          hadith: hadithResult.meta
        }
      },
      { headers: cacheHeaders(60 * 60 * 24) }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 }
    );
  }
}
