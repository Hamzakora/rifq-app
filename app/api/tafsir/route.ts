import { NextRequest, NextResponse } from "next/server";
import { getArabicMuyassarSurahTafsir, getArabicMuyassarTafsir } from "@/lib/sources/quranEnc";
import { auditLog } from "@/lib/security/auditLog";
import { cacheHeaders } from "@/lib/http/cache";

function fallbackTafsirPayload(sura: number, aya: number, wholeSurah: boolean, message: string) {
  const fallbackText = "تعذر تحميل التفسير من المصدر الآن. تأكد من اتصال الإنترنت ثم جرّب مرة أخرى.";

  return {
    data: {
      result: [
        {
          sura,
          aya,
          translation: fallbackText,
          text: fallbackText,
          footnotes: message
        }
      ]
    },
    meta: {
      sourceName: "QuranEnc — fallback message",
      sourceUrl: `local://tafsir-fallback/${wholeSurah ? "surah" : "ayah"}/${sura}/${aya}`,
      fetchedAt: new Date().toISOString()
    }
  };
}

export async function GET(request: NextRequest) {
  const sura = Number(request.nextUrl.searchParams.get("sura") || "1");
  const aya = Number(request.nextUrl.searchParams.get("aya") || "1");
  const scope = request.nextUrl.searchParams.get("scope") || request.nextUrl.searchParams.get("mode") || "ayah";
  const wholeSurah = scope === "surah" || scope === "full" || request.nextUrl.searchParams.get("surah") === "true";

  try {
    await auditLog({ action: "read", target: "tafsir", metadata: { sura, aya, scope: wholeSurah ? "surah" : "ayah" } });

    const result = wholeSurah ? await getArabicMuyassarSurahTafsir(sura) : await getArabicMuyassarTafsir(sura, aya);
    return NextResponse.json(result, { headers: cacheHeaders() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(fallbackTafsirPayload(sura, aya, wholeSurah, message), { headers: cacheHeaders() });
  }
}
