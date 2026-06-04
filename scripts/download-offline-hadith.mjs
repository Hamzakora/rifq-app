import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "public", "offline-data");
const outFile = join(outDir, "hadith-library.json");
const BASE_URL = process.env.HADEETHENC_BASE_URL || "https://hadeethenc.com/api/v1";
const LANGUAGE = process.env.HADITH_LANGUAGE || "ar";
const PER_PAGE = Number(process.env.HADITH_PER_PAGE || 50);
const MAX_PAGES_PER_CATEGORY = Number(process.env.HADITH_MAX_PAGES_PER_CATEGORY || 120);
const FORCE = process.argv.includes("--force");

const FALLBACK_CATEGORIES = [
  { id: 1, title: "أحاديث جامعة", hadeeths_count: 4, children_count: 0 },
  { id: 2, title: "الأذكار والفضائل", hadeeths_count: 3, children_count: 0 },
  { id: 3, title: "الأخلاق والآداب", hadeeths_count: 3, children_count: 0 }
];

const FALLBACK_HADITHS = {
  1: [
    { id: 1001, title: "إنما الأعمال بالنيات", hadeeth: "إنما الأعمال بالنيات، وإنما لكل امرئ ما نوى.", attribution: "متفق عليه", grade: "صحيح", explanation: "يبين الحديث أن قبول العمل وثوابه مرتبط بالنية، وأن صلاح القلب أساس صلاح العمل." },
    { id: 1002, title: "الدين النصيحة", hadeeth: "الدين النصيحة.", attribution: "رواه مسلم", grade: "صحيح", explanation: "يدل الحديث على عظم شأن النصيحة، وأنها من أصول الدين في علاقة المسلم بربه وكتابه ورسوله والمسلمين." },
    { id: 1003, title: "من كان يؤمن بالله واليوم الآخر", hadeeth: "من كان يؤمن بالله واليوم الآخر فليقل خيرًا أو ليصمت.", attribution: "متفق عليه", grade: "صحيح", explanation: "يرشد الحديث إلى حفظ اللسان، وأن الكلام ينبغي أن يكون خيرًا أو يتركه الإنسان سلامة لدينه." },
    { id: 1004, title: "لا يؤمن أحدكم حتى يحب لأخيه", hadeeth: "لا يؤمن أحدكم حتى يحب لأخيه ما يحب لنفسه.", attribution: "متفق عليه", grade: "صحيح", explanation: "يبين الحديث كمال الإيمان بحب الخير للمسلمين وترك الحسد والأنانية." }
  ],
  2: [
    { id: 2001, title: "كلمتان خفيفتان على اللسان", hadeeth: "كلمتان خفيفتان على اللسان، ثقيلتان في الميزان، حبيبتان إلى الرحمن: سبحان الله وبحمده، سبحان الله العظيم.", attribution: "متفق عليه", grade: "صحيح", explanation: "فيه فضل الذكر وأن الكلمات اليسيرة قد يكون لها أجر عظيم عند الله تعالى." },
    { id: 2002, title: "أحب الكلام إلى الله", hadeeth: "أحب الكلام إلى الله: سبحان الله، والحمد لله، ولا إله إلا الله، والله أكبر.", attribution: "رواه مسلم", grade: "صحيح", explanation: "يدل الحديث على فضل هذه الأذكار الجامعة لمعاني التنزيه والحمد والتوحيد والتكبير." },
    { id: 2003, title: "من قال سبحان الله وبحمده", hadeeth: "من قال: سبحان الله وبحمده في يوم مائة مرة، حطت خطاياه وإن كانت مثل زبد البحر.", attribution: "متفق عليه", grade: "صحيح", explanation: "يبين الحديث فضل التسبيح والمداومة عليه، وأن الذكر سبب لمغفرة الذنوب." }
  ],
  3: [
    { id: 3001, title: "تبسمك في وجه أخيك صدقة", hadeeth: "تبسمك في وجه أخيك لك صدقة.", attribution: "رواه الترمذي", grade: "حسن", explanation: "يدعو الحديث إلى حسن الخلق وبذل المعروف ولو بأمر يسير كالبشاشة والابتسامة." },
    { id: 3002, title: "خيركم خيركم لأهله", hadeeth: "خيركم خيركم لأهله، وأنا خيركم لأهلي.", attribution: "رواه الترمذي", grade: "صحيح بمجموع طرقه عند عدد من أهل العلم", explanation: "يدل الحديث على أن حسن التعامل مع الأهل من أعظم دلائل الخيرية وحسن الخلق." },
    { id: 3003, title: "المسلم من سلم المسلمون", hadeeth: "المسلم من سلم المسلمون من لسانه ويده.", attribution: "متفق عليه", grade: "صحيح", explanation: "فيه بيان أن من كمال إسلام المرء أن يأمن الناس أذاه قولًا وفعلًا." }
  ]
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function findList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function getTitle(item) {
  return String(item?.title || item?.hadeeth_title || item?.name || "حديث");
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
  return Array.isArray(data?.categories) && data.categories.length > 0 && data?.hadiths && Object.keys(data.hadiths).length > 0;
}

function writeLibrary(library) {
  mkdirSync(outDir, { recursive: true });
  writeFileSync(outFile, JSON.stringify(library, null, 0), "utf8");
}

async function fetchJson(url, retries = 3) {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const res = await fetch(url, {
        headers: {
          accept: "application/json",
          "user-agent": "rifq-islamic-web-app/1.0"
        }
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      return await res.json();
    } catch (error) {
      lastError = error;
      if (attempt < retries) await sleep(650 * attempt);
    }
  }
  throw lastError;
}

function fallbackLibrary(reason = "fallback") {
  const categoryMap = {};
  const listItems = {};
  const hadiths = {};

  for (const category of FALLBACK_CATEGORIES) {
    const items = FALLBACK_HADITHS[category.id] || [];
    categoryMap[String(category.id)] = items.map((item) => item.id);
    for (const item of items) {
      listItems[String(item.id)] = { id: item.id, hadeeth_id: item.id, title: item.title, hadeeth_title: item.title };
      hadiths[String(item.id)] = item;
    }
  }

  return {
    meta: {
      sourceName: "مصدر أحاديث محلي احتياطي داخل رِفْق",
      sourceUrl: `local://fallback-hadith/${reason}`,
      generatedAt: new Date().toISOString(),
      language: LANGUAGE,
      categories: FALLBACK_CATEGORIES.length,
      hadiths: Object.keys(hadiths).length
    },
    categories: FALLBACK_CATEGORIES,
    categoryMap,
    listItems,
    hadiths
  };
}

const existing = readExisting();
if (!FORCE && isComplete(existing)) {
  console.log(`Offline hadith already ready in public/offline-data/hadith-library.json (${existing.categories.length} categories, ${Object.keys(existing.hadiths || {}).length} hadiths). Use --force to redownload.`);
  process.exit(0);
}

let categories;
try {
  const categoriesUrl = `${BASE_URL}/categories/roots/?language=${encodeURIComponent(LANGUAGE)}`;
  categories = await fetchJson(categoriesUrl);
  if (!Array.isArray(categories) || !categories.length) throw new Error("No categories returned from HadeethEnc.");
} catch (error) {
  console.warn(`Could not download HadeethEnc categories, using small fallback library: ${error instanceof Error ? error.message : error}`);
  const library = fallbackLibrary("categories-download-failed");
  writeLibrary(library);
  console.log(`Offline hadith fallback is ready in public/offline-data/hadith-library.json (${library.categories.length} categories, ${Object.keys(library.hadiths).length} hadiths).`);
  process.exit(0);
}

const library = {
  meta: {
    sourceName: "HadeethEnc API — local offline file",
    sourceUrl: `${BASE_URL}/hadeeths/list + /hadeeths/one`,
    generatedAt: new Date().toISOString(),
    language: LANGUAGE,
    categories: categories.length,
    hadiths: 0
  },
  categories: categories.map((category) => ({
    id: Number(category.id),
    title: String(category.title || category.name || "تصنيف"),
    hadeeths_count: Number(category.hadeeths_count || 0),
    children_count: Number(category.children_count || 0)
  })).filter((category) => Number.isInteger(category.id) && category.id > 0),
  categoryMap: {},
  listItems: {},
  hadiths: {}
};

writeLibrary(library);

for (const category of library.categories) {
  const categoryId = category.id;
  const count = Number(category.hadeeths_count || 0);
  const pagesToLoad = count > 0 ? Math.ceil(count / PER_PAGE) : MAX_PAGES_PER_CATEGORY;
  const ids = [];

  console.log(`downloading hadith category ${categoryId} — ${category.title}`);

  for (let page = 1; page <= Math.min(pagesToLoad, MAX_PAGES_PER_CATEGORY); page += 1) {
    const listUrl = `${BASE_URL}/hadeeths/list/?language=${encodeURIComponent(LANGUAGE)}&category_id=${categoryId}&page=${page}&per_page=${PER_PAGE}`;
    let rows = [];

    try {
      const listJson = await fetchJson(listUrl);
      rows = findList(listJson);
    } catch (error) {
      console.warn(`failed category ${categoryId} page ${page}: ${error instanceof Error ? error.message : error}`);
      break;
    }

    if (!rows.length) break;

    for (const row of rows) {
      const id = normalizeId(row?.id || row?.hadeeth_id || row?.key);
      if (!id) continue;
      if (!ids.includes(id)) ids.push(id);
      library.listItems[String(id)] = {
        id,
        hadeeth_id: id,
        title: getTitle(row),
        hadeeth_title: getTitle(row)
      };

      if (!library.hadiths[String(id)]) {
        const detailUrl = `${BASE_URL}/hadeeths/one/?language=${encodeURIComponent(LANGUAGE)}&id=${id}`;
        try {
          const detail = await fetchJson(detailUrl);
          library.hadiths[String(id)] = {
            ...detail,
            id: normalizeId(detail?.id || detail?.hadeeth_id || id) || id,
            hadeeth_id: normalizeId(detail?.hadeeth_id || detail?.id || id) || id,
            title: getTitle(detail) !== "حديث" ? getTitle(detail) : getTitle(row),
            hadeeth_title: getTitle(detail) !== "حديث" ? getTitle(detail) : getTitle(row)
          };
        } catch (error) {
          console.warn(`failed hadith ${id}: ${error instanceof Error ? error.message : error}`);
          library.hadiths[String(id)] = {
            id,
            hadeeth_id: id,
            title: getTitle(row),
            hadeeth_title: getTitle(row),
            hadeeth: "",
            attribution: "",
            grade: "",
            explanation: ""
          };
        }
      }
    }

    library.categoryMap[String(categoryId)] = ids;
    library.meta.hadiths = Object.keys(library.hadiths).length;
    library.meta.categories = library.categories.length;
    writeLibrary(library);
    console.log(`saved category ${categoryId} page ${page}/${Math.min(pagesToLoad, MAX_PAGES_PER_CATEGORY)} — total hadiths ${library.meta.hadiths}`);

    if (!count && rows.length < PER_PAGE) break;
  }

  library.categoryMap[String(categoryId)] = ids;
  writeLibrary(library);
}

if (!Object.keys(library.hadiths).length) {
  console.warn("No hadiths were downloaded, using small fallback library.");
  const fallback = fallbackLibrary("empty-download-result");
  writeLibrary(fallback);
  console.log(`Offline hadith fallback is ready in public/offline-data/hadith-library.json (${fallback.categories.length} categories, ${Object.keys(fallback.hadiths).length} hadiths).`);
  process.exit(0);
}

library.meta.generatedAt = new Date().toISOString();
library.meta.hadiths = Object.keys(library.hadiths).length;
library.meta.categories = library.categories.length;
writeLibrary(library);
console.log(`Offline hadith is ready in public/offline-data/hadith-library.json (${library.categories.length} categories, ${Object.keys(library.hadiths).length} hadiths).`);
