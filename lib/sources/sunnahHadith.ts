import { buildSourceMeta } from "@/lib/security/immutableReligiousText";

const SUNNAH_BASE_URL = process.env.SUNNAH_BASE_URL || "https://api.sunnah.com/v1";

export async function searchSunnahHadith(query: string) {
  const apiKey = process.env.SUNNAH_API_KEY;
  if (!apiKey) {
    throw new Error("Missing SUNNAH_API_KEY.");
  }

  const cleaned = query.trim();
  if (!cleaned || cleaned.length < 2) {
    throw new Error("Search query is too short.");
  }

  const url = new URL(`${SUNNAH_BASE_URL}/hadiths/search`);
  url.searchParams.set("query", cleaned);

  const res = await fetch(url.toString(), {
    headers: {
      "x-api-key": apiKey,
      accept: "application/json"
    },
    next: { revalidate: 60 * 60 }
  });

  if (!res.ok) {
    throw new Error(`Sunnah.com request failed: ${res.status}`);
  }

  const data = await res.json();

  return {
    data,
    meta: buildSourceMeta("Sunnah.com API", url.toString())
  };
}
