import { buildSourceMeta } from "@/lib/security/immutableReligiousText";
import { STATIC_AZKAR } from "@/lib/static/staticAzkar";
import { LONG_CACHE_SECONDS } from "@/lib/http/cache";

const DEFAULT_AZKAR_SOURCE =
  "https://raw.githubusercontent.com/rn0x/hisn_almuslim_json/main/hisn_almuslim.json";

export async function getAzkarFromApprovedJson() {
  // static = use the reviewed local azkar file.
  // hybrid = try the remote JSON first, then fallback to local.
  // remote = remote JSON only.
  //
  // Default is static now because the previous remote JSON structure sometimes
  // returned incomplete morning/evening categories in the UI.
  const mode = process.env.AZKAR_SOURCE_MODE || "static";

  if (mode === "static") {
    return {
      data: STATIC_AZKAR,
      meta: buildSourceMeta("حصن المسلم / ملف أذكار محلي مُراجع", "local://lib/static/staticAzkar.ts")
    };
  }

  const sourceUrl = process.env.AZKAR_SOURCE_URL || DEFAULT_AZKAR_SOURCE;

  try {
    const res = await fetch(sourceUrl, {
      headers: {
        accept: "application/json",
        "user-agent": "rifq-islamic-web-app/1.0"
      },
      cache: "force-cache",
      next: { revalidate: LONG_CACHE_SECONDS }
    });

    if (!res.ok) {
      throw new Error(`Azkar source request failed: ${res.status}`);
    }

    const data = await res.json();

    return {
      data,
      meta: buildSourceMeta("Hisn Al Muslim JSON — remote source", sourceUrl)
    };
  } catch (error) {
    if (mode === "hybrid") {
      return {
        data: STATIC_AZKAR,
        meta: buildSourceMeta("حصن المسلم / ملف أذكار محلي مُراجع", "local://lib/static/staticAzkar.ts")
      };
    }

    throw error;
  }
}
