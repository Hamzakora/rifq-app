import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "public", "offline-data");
const outFile = join(outDir, "quran-pages.json");
const BASE_URL = process.env.ALQURAN_CLOUD_BASE_URL || "https://api.alquran.cloud/v1";
const TOTAL_PAGES = 604;
const FORCE = process.argv.includes("--force");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readExisting() {
  if (!existsSync(outFile)) return null;
  try {
    return JSON.parse(readFileSync(outFile, "utf8"));
  } catch {
    return null;
  }
}

function isComplete(data) {
  return data?.pages && Object.keys(data.pages).length >= TOTAL_PAGES;
}

async function fetchJson(url, retries = 3) {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const res = await fetch(url, { headers: { accept: "application/json" } });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      return await res.json();
    } catch (error) {
      lastError = error;
      if (attempt < retries) await sleep(650 * attempt);
    }
  }
  throw lastError;
}

function normalizeAyah(ayah, page) {
  return {
    number: Number(ayah?.number || 0),
    text: String(ayah?.text || ""),
    numberInSurah: Number(ayah?.numberInSurah || 0),
    juz: Number(ayah?.juz || 0),
    manzil: Number(ayah?.manzil || 0),
    page: Number(ayah?.page || page),
    ruku: Number(ayah?.ruku || 0),
    hizbQuarter: Number(ayah?.hizbQuarter || 0),
    sajda: ayah?.sajda || false,
    surah: ayah?.surah
      ? {
          number: Number(ayah.surah.number || 0),
          name: String(ayah.surah.name || ""),
          englishName: String(ayah.surah.englishName || ""),
          englishNameTranslation: String(ayah.surah.englishNameTranslation || ""),
          revelationType: String(ayah.surah.revelationType || ""),
          numberOfAyahs: Number(ayah.surah.numberOfAyahs || 0)
        }
      : undefined
  };
}

const existing = readExisting();
if (!FORCE && isComplete(existing)) {
  console.log("Offline Quran pages already ready in public/offline-data/quran-pages.json (604 pages). Use --force to redownload.");
  process.exit(0);
}

mkdirSync(outDir, { recursive: true });
const pages = existing?.pages && !FORCE ? existing.pages : {};

for (let page = 1; page <= TOTAL_PAGES; page += 1) {
  if (pages[String(page)]?.ayahs?.length && !FORCE) {
    console.log(`exists quran page ${page}/${TOTAL_PAGES}`);
    continue;
  }

  const url = `${BASE_URL}/page/${page}/quran-uthmani`;
  const json = await fetchJson(url);
  const ayahs = Array.isArray(json?.data?.ayahs) ? json.data.ayahs.map((ayah) => normalizeAyah(ayah, page)) : [];

  if (!ayahs.length) throw new Error(`No ayahs returned for page ${page}`);

  pages[String(page)] = { page, ayahs };
  writeFileSync(
    outFile,
    JSON.stringify(
      {
        meta: {
          sourceName: "AlQuran.cloud — Quran Uthmani local pages",
          sourceUrl: `${BASE_URL}/page/[1-604]/quran-uthmani`,
          generatedAt: new Date().toISOString(),
          pages: Object.keys(pages).length,
          totalAyahs: Object.values(pages).reduce((sum, item) => sum + (item.ayahs?.length || 0), 0)
        },
        pages
      },
      null,
      0
    ),
    "utf8"
  );
  console.log(`saved quran page ${page}/${TOTAL_PAGES}`);
}

console.log("Offline Quran pages are ready in public/offline-data/quran-pages.json (604 pages).");
