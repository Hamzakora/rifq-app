import { NextRequest, NextResponse } from "next/server";
import { searchDorarHadith } from "@/lib/sources/dorarHadith";
import { searchSunnahHadith } from "@/lib/sources/sunnahHadith";
import { getHadeethsByCategory } from "@/lib/sources/hadeethEnc";
import { auditLog } from "@/lib/security/auditLog";
import { cacheHeaders } from "@/lib/http/cache";

export async function GET(request: NextRequest) {
  try {
    const provider = process.env.HADITH_PROVIDER || "hadeethenc";

    await auditLog({
      action: "search",
      target: "hadith",
      metadata: {
        provider,
        query: request.nextUrl.searchParams.toString()
      }
    });

    if (provider === "sunnah") {
      const q = request.nextUrl.searchParams.get("q") || "";
      const result = await searchSunnahHadith(q);
      return NextResponse.json(result, { headers: cacheHeaders() });
    }

    if (provider === "dorar") {
      const q = request.nextUrl.searchParams.get("q") || "";
      const result = await searchDorarHadith(q);
      return NextResponse.json(result, { headers: cacheHeaders() });
    }

    const categoryId = Number(request.nextUrl.searchParams.get("categoryId") || "1");
    const page = Number(request.nextUrl.searchParams.get("page") || "1");
    const perPage = Number(request.nextUrl.searchParams.get("perPage") || "20");

    const result = await getHadeethsByCategory({
      categoryId,
      page,
      perPage,
      language: "ar"
    });

    return NextResponse.json(result, { headers: cacheHeaders() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 }
    );
  }
}
