import { NextRequest, NextResponse } from "next/server";
import { buildSourceMeta } from "@/lib/security/immutableReligiousText";
import { auditLog } from "@/lib/security/auditLog";
import { cacheHeaders } from "@/lib/http/cache";

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

export async function GET(request: NextRequest) {
  const juz = Number(request.nextUrl.searchParams.get("juz") || "1");

  try {
    if (!Number.isInteger(juz) || juz < 1 || juz > 30) {
      return NextResponse.json({ error: "رقم الجزء يجب أن يكون بين 1 و30." }, { status: 400 });
    }

    await auditLog({ action: "read", target: "quran.juz", metadata: { juz } });

    const url = `${BASE_URL}/juz/${juz}/quran-uthmani`;
    const res = await fetchWithTimeout(url, {
      headers: { accept: "application/json" },
      next: { revalidate: 60 * 60 * 24 }
    });

    if (!res.ok) throw new Error(`Quran juz request failed: ${res.status}`);

    const data = await res.json();

    return NextResponse.json({
      data: data?.data || data,
      meta: buildSourceMeta("AlQuran.cloud Juz", url)
    });
  } catch (error) {
    return NextResponse.json({
      data: { ayahs: [], juz },
      meta: buildSourceMeta("AlQuran.cloud Juz unavailable — fallback", `local://quran/juz/${juz}`),
      warning: error instanceof Error ? error.message : "Unknown error"
    }, { headers: cacheHeaders() });
  }
}
