import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "public", "offline-data");
const outFile = join(outDir, "tafsir-muyassar.json");
const BASE_URL = process.env.QURANENC_BASE_URL || "https://quranenc.com/api/v1";
const KEY = process.env.QURANENC_TAFSIR_KEY || "arabic_moyassar";
const FORCE = process.argv.includes("--force");
const EXPECTED_AYAH_TOTAL = 6236;

const STATIC_SURAH_LIST = [
  [1,"الفاتحة",7],[2,"البقرة",286],[3,"آل عمران",200],[4,"النساء",176],[5,"المائدة",120],[6,"الأنعام",165],[7,"الأعراف",206],[8,"الأنفال",75],[9,"التوبة",129],[10,"يونس",109],[11,"هود",123],[12,"يوسف",111],[13,"الرعد",43],[14,"إبراهيم",52],[15,"الحجر",99],[16,"النحل",128],[17,"الإسراء",111],[18,"الكهف",110],[19,"مريم",98],[20,"طه",135],[21,"الأنبياء",112],[22,"الحج",78],[23,"المؤمنون",118],[24,"النور",64],[25,"الفرقان",77],[26,"الشعراء",227],[27,"النمل",93],[28,"القصص",88],[29,"العنكبوت",69],[30,"الروم",60],[31,"لقمان",34],[32,"السجدة",30],[33,"الأحزاب",73],[34,"سبأ",54],[35,"فاطر",45],[36,"يس",83],[37,"الصافات",182],[38,"ص",88],[39,"الزمر",75],[40,"غافر",85],[41,"فصلت",54],[42,"الشورى",53],[43,"الزخرف",89],[44,"الدخان",59],[45,"الجاثية",37],[46,"الأحقاف",35],[47,"محمد",38],[48,"الفتح",29],[49,"الحجرات",18],[50,"ق",45],[51,"الذاريات",60],[52,"الطور",49],[53,"النجم",62],[54,"القمر",55],[55,"الرحمن",78],[56,"الواقعة",96],[57,"الحديد",29],[58,"المجادلة",22],[59,"الحشر",24],[60,"الممتحنة",13],[61,"الصف",14],[62,"الجمعة",11],[63,"المنافقون",11],[64,"التغابن",18],[65,"الطلاق",12],[66,"التحريم",12],[67,"الملك",30],[68,"القلم",52],[69,"الحاقة",52],[70,"المعارج",44],[71,"نوح",28],[72,"الجن",28],[73,"المزمل",20],[74,"المدثر",56],[75,"القيامة",40],[76,"الإنسان",31],[77,"المرسلات",50],[78,"النبأ",40],[79,"النازعات",46],[80,"عبس",42],[81,"التكوير",29],[82,"الانفطار",19],[83,"المطففين",36],[84,"الانشقاق",25],[85,"البروج",22],[86,"الطارق",17],[87,"الأعلى",19],[88,"الغاشية",26],[89,"الفجر",30],[90,"البلد",20],[91,"الشمس",15],[92,"الليل",21],[93,"الضحى",11],[94,"الشرح",8],[95,"التين",8],[96,"العلق",19],[97,"القدر",5],[98,"البينة",8],[99,"الزلزلة",8],[100,"العاديات",11],[101,"القارعة",11],[102,"التكاثر",8],[103,"العصر",3],[104,"الهمزة",9],[105,"الفيل",5],[106,"قريش",4],[107,"الماعون",7],[108,"الكوثر",3],[109,"الكافرون",6],[110,"النصر",3],[111,"المسد",5],[112,"الإخلاص",4],[113,"الفلق",5],[114,"الناس",6]
];

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

function countAyahs(data) {
  if (!data?.surahs) return 0;
  return Object.values(data.surahs).reduce((sum, surah) => sum + Object.keys(surah?.ayahs || {}).length, 0);
}

function isComplete(data) {
  return countAyahs(data) >= EXPECTED_AYAH_TOTAL;
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
      if (attempt < retries) await sleep(800 * attempt);
    }
  }
  throw lastError;
}

function firstResult(json) {
  const raw = json?.result ?? json?.data?.result ?? json?.data;
  return Array.isArray(raw) ? raw[0] : raw;
}

function normalizeItem(raw, aya) {
  return {
    aya,
    ayahText: String(raw?.arabic_text || raw?.aya_text || raw?.quran_text || raw?.source_text || ""),
    tafsirText: String(raw?.translation || raw?.text || raw?.tafsir || raw?.meaning || "").replace(/<[^>]*>/g, "").trim(),
    footnotes: String(raw?.footnotes || raw?.footnote || "").replace(/<[^>]*>/g, "").trim()
  };
}

async function fetchAyah(sura, aya) {
  const url = `${BASE_URL}/translation/aya/${encodeURIComponent(KEY)}/${sura}/${aya}`;
  const json = await fetchJson(url);
  return normalizeItem(firstResult(json), aya);
}

async function fetchSurah(sura, ayahCount) {
  const url = `${BASE_URL}/translation/sura/${encodeURIComponent(KEY)}/${sura}`;
  const json = await fetchJson(url);
  const raw = json?.result ?? json?.data?.result ?? json?.data;
  const list = Array.isArray(raw) ? raw : [];

  if (list.length >= Math.min(ayahCount, 1)) {
    const ayahs = {};
    for (const item of list) {
      const aya = Number(item?.aya || item?.aya_number || item?.number_in_surah || Object.keys(ayahs).length + 1);
      const normalized = normalizeItem(item, aya);
      if (normalized.tafsirText) ayahs[String(aya)] = normalized;
    }
    if (Object.keys(ayahs).length >= ayahCount) return ayahs;
  }

  const ayahs = {};
  for (let aya = 1; aya <= ayahCount; aya += 1) {
    const item = await fetchAyah(sura, aya);
    if (!item.tafsirText) throw new Error(`No tafsir returned for ${sura}:${aya}`);
    ayahs[String(aya)] = item;
    console.log(`saved tafsir ${sura}:${aya}`);
  }
  return ayahs;
}

const existing = readExisting();
if (!FORCE && isComplete(existing)) {
  console.log(`Offline tafsir already ready in public/offline-data/tafsir-muyassar.json (${countAyahs(existing)}/${EXPECTED_AYAH_TOTAL} ayahs). Use --force to redownload.`);
  process.exit(0);
}

mkdirSync(outDir, { recursive: true });
const surahs = existing?.surahs && !FORCE ? existing.surahs : {};

for (const [sura, name, ayahCount] of STATIC_SURAH_LIST) {
  if (surahs[String(sura)] && Object.keys(surahs[String(sura)].ayahs || {}).length >= ayahCount && !FORCE) {
    console.log(`exists tafsir surah ${sura}/114 — ${name}`);
    continue;
  }

  console.log(`downloading tafsir surah ${sura}/114 — ${name}`);
  const ayahs = await fetchSurah(sura, ayahCount);
  surahs[String(sura)] = { number: sura, name, ayahs };

  writeFileSync(
    outFile,
    JSON.stringify(
      {
        meta: {
          sourceName: `QuranEnc — ${KEY} local file`,
          sourceUrl: `${BASE_URL}/translation/sura/${KEY}/[1-114]`,
          generatedAt: new Date().toISOString(),
          totalAyahs: Object.values(surahs).reduce((sum, surah) => sum + Object.keys(surah.ayahs || {}).length, 0)
        },
        surahs
      },
      null,
      0
    ),
    "utf8"
  );
  console.log(`saved tafsir surah ${sura}/114 — ${name}`);
}

const total = Object.values(surahs).reduce((sum, surah) => sum + Object.keys(surah.ayahs || {}).length, 0);
if (total < EXPECTED_AYAH_TOTAL) {
  throw new Error(`Offline tafsir is incomplete: ${total}/${EXPECTED_AYAH_TOTAL} ayahs.`);
}

console.log(`Offline tafsir is ready in public/offline-data/tafsir-muyassar.json (${total}/${EXPECTED_AYAH_TOTAL} ayahs).`);
