import { NextRequest, NextResponse } from "next/server";
import { buildSourceMeta } from "@/lib/security/immutableReligiousText";
import { auditLog } from "@/lib/security/auditLog";

const BASE_URL = process.env.ALQURAN_CLOUD_BASE_URL || "https://api.alquran.cloud/v1";

export async function GET(request: NextRequest) {
  try {
    const chapter = Number(request.nextUrl.searchParams.get("chapter") || "1");
    const edition = request.nextUrl.searchParams.get("edition") || "ar.alafasy";

    if (!Number.isInteger(chapter) || chapter < 1 || chapter > 114) {
      return NextResponse.json({ error: "رقم السورة غير صحيح." }, { status: 400 });
    }

    await auditLog({ action: "read", target: "quran.audio", metadata: { chapter, edition } });

    const url = `${BASE_URL}/surah/${chapter}/${encodeURIComponent(edition)}`;
    const res = await fetch(url, {
      headers: { accept: "application/json" },
      next: { revalidate: 60 * 60 * 24 }
    });

    if (!res.ok) throw new Error(`Quran audio request failed: ${res.status}`);

    const data = await res.json();

    return NextResponse.json({
      data: data?.data || data,
      meta: buildSourceMeta("AlQuran.cloud Audio", url)
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 }
    );
  }
}
