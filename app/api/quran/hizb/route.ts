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
  const hizb = Number(request.nextUrl.searchParams.get("hizb") || "1");
  const hizbQuarter = (hizb - 1) * 4 + 1;

  try {
    if (!Number.isInteger(hizb) || hizb < 1 || hizb > 60) {
      return NextResponse.json({ error: "رقم الحزب يجب أن يكون بين 1 و60." }, { status: 400 });
    }

    await auditLog({ action: "read", target: "quran.hizb", metadata: { hizb, hizbQuarter } });

    const url = `${BASE_URL}/hizbQuarter/${hizbQuarter}/quran-uthmani`;
    const res = await fetchWithTimeout(url, {
      headers: { accept: "application/json" },
      next: { revalidate: 60 * 60 * 24 }
    });

    if (!res.ok) throw new Error(`Quran hizb request failed: ${res.status}`);

    const data = await res.json();

    return NextResponse.json({
      data: data?.data || data,
      meta: buildSourceMeta("AlQuran.cloud Hizb Quarter", url)
    });
  } catch (error) {
    return NextResponse.json({
      data: { ayahs: [], hizbQuarter },
      meta: buildSourceMeta("AlQuran.cloud Hizb unavailable — fallback", `local://quran/hizb/${hizb}`),
      warning: error instanceof Error ? error.message : "Unknown error"
    }, { headers: cacheHeaders() });
  }
}
