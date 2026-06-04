import { NextRequest, NextResponse } from "next/server";
import { getSurah } from "@/lib/sources/alQuranCloud";
import { auditLog } from "@/lib/security/auditLog";
import { cacheHeaders } from "@/lib/http/cache";

export async function GET(request: NextRequest) {
  try {
    const chapter = Number(request.nextUrl.searchParams.get("chapter") || "1");
    const edition = request.nextUrl.searchParams.get("edition") || "quran-uthmani";

    await auditLog({ action: "read", target: "quran.verses", metadata: { chapter, edition } });

    const result = await getSurah(chapter, edition);
    return NextResponse.json(result, { headers: cacheHeaders() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 }
    );
  }
}
