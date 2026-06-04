import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const dataDir = join(root, "public", "offline-data");
const mode = process.argv.includes("--tafsir") ? "tafsir" : process.argv.includes("--quran") ? "quran" : process.argv.includes("--hadith") ? "hadith" : "all";
const EXPECTED_PAGES = 604;
const EXPECTED_AYAHS = 6236;

function readJson(name) {
  const file = join(dataDir, name);
  if (!existsSync(file)) throw new Error(`Missing ${file}`);
  return JSON.parse(readFileSync(file, "utf8"));
}

function checkQuranPages() {
  const json = readJson("quran-pages.json");
  const pages = json?.pages || {};
  const pageCount = Object.keys(pages).length;
  const ayahCount = Object.values(pages).reduce((sum, page) => sum + (page?.ayahs?.length || 0), 0);
  console.log(`Offline Quran pages: ${pageCount}/${EXPECTED_PAGES} pages, ${ayahCount}/${EXPECTED_AYAHS} ayahs.`);
  if (pageCount < EXPECTED_PAGES || ayahCount < EXPECTED_AYAHS) process.exit(1);
}

function checkTafsir() {
  const json = readJson("tafsir-muyassar.json");
  const surahs = json?.surahs || {};
  const ayahCount = Object.values(surahs).reduce((sum, surah) => sum + Object.keys(surah?.ayahs || {}).length, 0);
  const surahCount = Object.keys(surahs).length;
  console.log(`Offline tafsir: ${surahCount}/114 surahs, ${ayahCount}/${EXPECTED_AYAHS} ayahs.`);
  if (surahCount < 114 || ayahCount < EXPECTED_AYAHS) process.exit(1);
}

function checkHadith() {
  const json = readJson("hadith-library.json");
  const categoryCount = Array.isArray(json?.categories) ? json.categories.length : 0;
  const hadithCount = json?.hadiths ? Object.keys(json.hadiths).length : 0;
  const mappedCount = json?.categoryMap ? Object.keys(json.categoryMap).length : 0;
  console.log(`Offline hadith: ${categoryCount} categories, ${hadithCount} hadiths, ${mappedCount} mapped categories.`);
  if (categoryCount < 1 || hadithCount < 1 || mappedCount < 1) process.exit(1);
}

try {
  if (mode === "quran" || mode === "all") checkQuranPages();
  if (mode === "tafsir" || mode === "all") checkTafsir();
  if (mode === "hadith" || mode === "all") checkHadith();
  console.log("Offline data is ready.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
