import { cachedJsonFetch, HADITH_CACHE } from "@/lib/client/offlineCache";

export type HadithCategory = {
  id: number;
  title: string;
  hadeeths_count?: number;
  children_count?: number;
};

export type HadithListItem = {
  id: number;
  hadeeth_id?: number;
  title: string;
  hadeeth_title?: string;
};

export type HadithDetail = {
  id: number;
  hadeeth_id?: number;
  title?: string;
  hadeeth_title?: string;
  hadeeth?: string;
  text?: string;
  body?: string;
  attribution?: string;
  grade?: string;
  explanation?: string;
  [key: string]: unknown;
};

export type OfflineHadithLibrary = {
  meta?: {
    sourceName?: string;
    sourceUrl?: string;
    generatedAt?: string;
    categories?: number;
    hadiths?: number;
  };
  categories: HadithCategory[];
  categoryMap: Record<string, number[]>;
  listItems: Record<string, HadithListItem>;
  hadiths: Record<string, HadithDetail>;
};

type HadithListResponse = {
  data: {
    data: HadithListItem[];
    current_page: number;
    per_page: number;
    total: number;
  };
  meta: {
    sourceName: string;
    sourceUrl?: string;
    fetchedAt?: string;
    offline?: boolean;
  };
};

type HadithOneResponse = {
  data: HadithDetail;
  meta: {
    sourceName: string;
    sourceUrl?: string;
    fetchedAt?: string;
    offline?: boolean;
  };
};

const OFFLINE_HADITH_FILE = "/offline-data/hadith-library.json";
const OFFLINE_HADITH_PATHS = [
  "/offline-data/hadith-library.json",
  "offline-data/hadith-library.json",
  "./offline-data/hadith-library.json",
  "file:///android_asset/public/offline-data/hadith-library.json"
];

const FALLBACK_CATEGORIES: HadithCategory[] = [
  { id: 1, title: "أحاديث جامعة", hadeeths_count: 4, children_count: 0 },
  { id: 2, title: "الأذكار والفضائل", hadeeths_count: 3, children_count: 0 },
  { id: 3, title: "الأخلاق والآداب", hadeeths_count: 3, children_count: 0 }
];

const FALLBACK_HADITHS: Record<string, HadithDetail> = {
  "1001": {
    id: 1001,
    title: "إنما الأعمال بالنيات",
    hadeeth: "إنما الأعمال بالنيات، وإنما لكل امرئ ما نوى.",
    attribution: "متفق عليه",
    grade: "صحيح",
    explanation: "يبين الحديث أن قبول العمل وثوابه مرتبط بالنية، وأن صلاح القلب أساس صلاح العمل."
  },
  "1002": {
    id: 1002,
    title: "الدين النصيحة",
    hadeeth: "الدين النصيحة.",
    attribution: "رواه مسلم",
    grade: "صحيح",
    explanation: "يدل الحديث على عظم شأن النصيحة، وأنها من أصول الدين في علاقة المسلم بربه وكتابه ورسوله والمسلمين."
  },
  "1003": {
    id: 1003,
    title: "من كان يؤمن بالله واليوم الآخر",
    hadeeth: "من كان يؤمن بالله واليوم الآخر فليقل خيرًا أو ليصمت.",
    attribution: "متفق عليه",
    grade: "صحيح",
    explanation: "يرشد الحديث إلى حفظ اللسان، وأن الكلام ينبغي أن يكون خيرًا أو يتركه الإنسان سلامة لدينه."
  },
  "1004": {
    id: 1004,
    title: "لا يؤمن أحدكم حتى يحب لأخيه",
    hadeeth: "لا يؤمن أحدكم حتى يحب لأخيه ما يحب لنفسه.",
    attribution: "متفق عليه",
    grade: "صحيح",
    explanation: "يبين الحديث كمال الإيمان بحب الخير للمسلمين وترك الحسد والأنانية."
  },
  "2001": {
    id: 2001,
    title: "كلمتان خفيفتان على اللسان",
    hadeeth: "كلمتان خفيفتان على اللسان، ثقيلتان في الميزان، حبيبتان إلى الرحمن: سبحان الله وبحمده، سبحان الله العظيم.",
    attribution: "متفق عليه",
    grade: "صحيح",
    explanation: "فيه فضل الذكر وأن الكلمات اليسيرة قد يكون لها أجر عظيم عند الله تعالى."
  },
  "2002": {
    id: 2002,
    title: "أحب الكلام إلى الله",
    hadeeth: "أحب الكلام إلى الله: سبحان الله، والحمد لله، ولا إله إلا الله، والله أكبر.",
    attribution: "رواه مسلم",
    grade: "صحيح",
    explanation: "يدل الحديث على فضل هذه الأذكار الجامعة لمعاني التنزيه والحمد والتوحيد والتكبير."
  },
  "2003": {
    id: 2003,
    title: "من قال سبحان الله وبحمده",
    hadeeth: "من قال: سبحان الله وبحمده في يوم مائة مرة، حطت خطاياه وإن كانت مثل زبد البحر.",
    attribution: "متفق عليه",
    grade: "صحيح",
    explanation: "يبين الحديث فضل التسبيح والمداومة عليه، وأن الذكر سبب لمغفرة الذنوب."
  },
  "3001": {
    id: 3001,
    title: "تبسمك في وجه أخيك صدقة",
    hadeeth: "تبسمك في وجه أخيك لك صدقة.",
    attribution: "رواه الترمذي",
    grade: "حسن",
    explanation: "يدعو الحديث إلى حسن الخلق وبذل المعروف ولو بأمر يسير كالبشاشة والابتسامة."
  },
  "3002": {
    id: 3002,
    title: "خيركم خيركم لأهله",
    hadeeth: "خيركم خيركم لأهله، وأنا خيركم لأهلي.",
    attribution: "رواه الترمذي",
    grade: "صحيح بمجموع طرقه عند عدد من أهل العلم",
    explanation: "يدل الحديث على أن حسن التعامل مع الأهل من أعظم دلائل الخيرية وحسن الخلق."
  },
  "3003": {
    id: 3003,
    title: "المسلم من سلم المسلمون",
    hadeeth: "المسلم من سلم المسلمون من لسانه ويده.",
    attribution: "متفق عليه",
    grade: "صحيح",
    explanation: "فيه بيان أن من كمال إسلام المرء أن يأمن الناس أذاه قولًا وفعلًا."
  }
};

const fallbackCategoryMap: Record<string, number[]> = {
  "1": [1001, 1002, 1003, 1004],
  "2": [2001, 2002, 2003],
  "3": [3001, 3002, 3003]
};

const fallbackLibrary: OfflineHadithLibrary = {
  meta: {
    sourceName: "مصدر أحاديث محلي احتياطي داخل رِفْق",
    sourceUrl: "local://fallback-hadith",
    generatedAt: new Date(0).toISOString(),
    categories: FALLBACK_CATEGORIES.length,
    hadiths: Object.keys(FALLBACK_HADITHS).length
  },
  categories: FALLBACK_CATEGORIES,
  categoryMap: fallbackCategoryMap,
  listItems: Object.fromEntries(
    Object.values(FALLBACK_HADITHS).map((item) => [
      String(item.id),
      {
        id: item.id,
        hadeeth_id: item.id,
        title: String(item.title || item.hadeeth_title || "حديث"),
        hadeeth_title: String(item.title || item.hadeeth_title || "حديث")
      }
    ])
  ),
  hadiths: FALLBACK_HADITHS
};

let localLibraryPromise: Promise<OfflineHadithLibrary | null> | null = null;

function normalizeId(value: unknown) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function normalizeTitle(item: any) {
  return String(item?.title || item?.hadeeth_title || item?.name || "حديث");
}

function normalizeList(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

async function fetchLocalHadithLibrary() {
  for (const path of OFFLINE_HADITH_PATHS) {
    try {
      const response = await fetch(path, { cache: "force-cache" });
      if (!response.ok) continue;
      const json = (await response.json()) as OfflineHadithLibrary;
      if (Array.isArray(json?.categories) && json?.hadiths && json?.categoryMap) return json;
    } catch {
      // Try the next static asset path.
    }
  }

  return null;
}

export async function getOfflineHadithLibrary() {
  if (!localLibraryPromise) localLibraryPromise = fetchLocalHadithLibrary();
  return localLibraryPromise;
}

function localMeta(library: OfflineHadithLibrary | null) {
  return {
    sourceName: library?.meta?.sourceName || "مكتبة الحديث المحلية داخل رِفْق",
    sourceUrl: library?.meta?.sourceUrl || OFFLINE_HADITH_FILE,
    fetchedAt: library?.meta?.generatedAt,
    offline: true
  };
}

export async function getHadithCategoriesOfflineFirst() {
  const local = await getOfflineHadithLibrary();
  if (local) {
    return {
      data: local.categories,
      meta: localMeta(local)
    };
  }

  try {
    return await cachedJsonFetch("/api/hadith/categories", HADITH_CACHE);
  } catch {
    return {
      data: fallbackLibrary.categories,
      meta: localMeta(fallbackLibrary)
    };
  }
}

export async function getHadithsByCategoryOfflineFirst(params: { categoryId: number; page?: number; perPage?: number }): Promise<HadithListResponse> {
  const categoryId = normalizeId(params.categoryId) || 1;
  const page = Math.max(1, Number(params.page || 1));
  const perPage = Math.max(1, Number(params.perPage || 20));
  const local = await getOfflineHadithLibrary();

  if (local) {
    const ids = local.categoryMap[String(categoryId)] || [];
    const start = (page - 1) * perPage;
    const data = ids.slice(start, start + perPage).map((id) => {
      const listItem = local.listItems[String(id)];
      const full = local.hadiths[String(id)];
      return {
        id,
        hadeeth_id: id,
        title: normalizeTitle(listItem || full),
        hadeeth_title: normalizeTitle(listItem || full)
      };
    });

    return {
      data: {
        data,
        current_page: page,
        per_page: perPage,
        total: ids.length
      },
      meta: localMeta(local)
    };
  }

  try {
    return await cachedJsonFetch(`/api/hadith/search?categoryId=${categoryId}&page=${page}&perPage=${perPage}`, HADITH_CACHE);
  } catch {
    const ids = fallbackLibrary.categoryMap[String(categoryId)] || Object.keys(fallbackLibrary.hadiths).map(Number);
    const start = (page - 1) * perPage;
    const data = ids.slice(start, start + perPage).map((id) => {
      const item = fallbackLibrary.hadiths[String(id)];
      return { id, hadeeth_id: id, title: normalizeTitle(item), hadeeth_title: normalizeTitle(item) };
    });
    return {
      data: {
        data,
        current_page: page,
        per_page: perPage,
        total: ids.length
      },
      meta: localMeta(fallbackLibrary)
    };
  }
}

export async function getHadithByIdOfflineFirst(idValue: number): Promise<HadithOneResponse> {
  const id = normalizeId(idValue);
  if (!id) throw new Error("رقم الحديث غير صحيح.");

  const local = await getOfflineHadithLibrary();
  if (local?.hadiths?.[String(id)]) {
    return {
      data: local.hadiths[String(id)],
      meta: localMeta(local)
    };
  }

  try {
    return await cachedJsonFetch(`/api/hadith/one?id=${id}`, HADITH_CACHE);
  } catch {
    const fallback = fallbackLibrary.hadiths[String(id)] || Object.values(fallbackLibrary.hadiths)[0];
    return {
      data: fallback,
      meta: localMeta(fallbackLibrary)
    };
  }
}

export async function cacheLocalHadithFile(onProgress?: (done: number, total: number, message: string) => void) {
  onProgress?.(0, 1, "جاري حفظ ملف الأحاديث المحلي...");
  const response = await fetch(OFFLINE_HADITH_FILE, { cache: "reload" });
  if (!response.ok) throw new Error("تعذر فتح الأحاديث دون اتصال.");
  if (typeof window !== "undefined" && "caches" in window) {
    const cache = await caches.open(HADITH_CACHE);
    await cache.put(new URL(OFFLINE_HADITH_FILE, window.location.origin).toString(), response.clone());
  }
  localLibraryPromise = Promise.resolve((await response.json()) as OfflineHadithLibrary);
  onProgress?.(1, 1, "تم حفظ ملف الأحاديث المحلي.");
}
