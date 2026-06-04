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
  const page = Number(request.nextUrl.searchParams.get("page") || "1");

  try {
    if (!Number.isInteger(page) || page < 1 || page > 604) {
      return NextResponse.json({ error: "رقم الصفحة يجب أن يكون بين 1 و604." }, { status: 400 });
    }

    await auditLog({ action: "read", target: "quran.page", metadata: { page } });

    const url = `${BASE_URL}/page/${page}/quran-uthmani`;
    const res = await fetchWithTimeout(url, {
      headers: { accept: "application/json" },
      next: { revalidate: 60 * 60 * 24 }
    });

    if (!res.ok) throw new Error(`Quran page request failed: ${res.status}`);

    const data = await res.json();

    return NextResponse.json({
      data: data?.data || data,
      meta: buildSourceMeta("AlQuran.cloud Page", url)
    });
  } catch (error) {
    return NextResponse.json({
      data: { ayahs: [], page },
      meta: buildSourceMeta("AlQuran.cloud Page unavailable — fallback", `local://quran/page/${page}`),
      warning: error instanceof Error ? error.message : "Unknown error"
    }, { headers: cacheHeaders() });
  }
}
