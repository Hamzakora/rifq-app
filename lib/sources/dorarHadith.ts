import { buildSourceMeta } from "@/lib/security/immutableReligiousText";

const DORAR_API_URL = process.env.DORAR_API_URL || "https://dorar.net/dorar_api.json";

export async function searchDorarHadith(query: string) {
  const cleaned = query.trim();

  if (!cleaned || cleaned.length < 2) {
    throw new Error("Search query is too short.");
  }

  const url = new URL(DORAR_API_URL);
  url.searchParams.set("skey", cleaned);

  const res = await fetch(url.toString(), {
    headers: { accept: "application/json" },
    next: { revalidate: 60 * 60 }
  });

  if (!res.ok) {
    throw new Error(`Dorar request failed: ${res.status}`);
  }

  const data = await res.json();

  return {
    data,
    meta: buildSourceMeta("Dorar Hadith Encyclopedia API", url.toString())
  };
}
