import { NextResponse } from "next/server";
import { getSurahList } from "@/lib/sources/alQuranCloud";
import { auditLog } from "@/lib/security/auditLog";
import { cacheHeaders } from "@/lib/http/cache";

export async function GET() {
  try {
    await auditLog({ action: "read", target: "quran.chapters" });
    const result = await getSurahList();
    return NextResponse.json(result, { headers: cacheHeaders() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
